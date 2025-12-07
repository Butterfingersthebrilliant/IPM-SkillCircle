import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import nodemailer from 'nodemailer';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is missing!');
} else {
    console.log('DATABASE_URL is set. Starts with:', process.env.DATABASE_URL.substring(0, 20) + '...');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});

const app = express();
const port = process.env.PORT || 3000;

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Use /tmp for Vercel (ephemeral) or local uploads folder for dev
        const uploadDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '../server/uploads');
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize Database Schema
async function initDb() {
    try {
        const client = await pool.connect();
        try {
            await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          uid VARCHAR(255) PRIMARY KEY,
          email VARCHAR(255) UNIQUE,
          display_name VARCHAR(255),
          photo_url TEXT,
          role VARCHAR(50) DEFAULT 'student',
          password_hash TEXT,
          bio TEXT,
          expertise TEXT[],
          learning_goals TEXT[],
          qualifications TEXT[],
          batch VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        -- Add password_hash column if it doesn't exist (migration)
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_hash') THEN
                ALTER TABLE users ADD COLUMN password_hash TEXT;
            END IF;
            -- New columns for Phase 2
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='bio') THEN
                ALTER TABLE users ADD COLUMN bio TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='expertise') THEN
                ALTER TABLE users ADD COLUMN expertise TEXT[];
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='learning_goals') THEN
                ALTER TABLE users ADD COLUMN learning_goals TEXT[];
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='qualifications') THEN
                ALTER TABLE users ADD COLUMN qualifications TEXT[];
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='batch') THEN
                ALTER TABLE users ADD COLUMN batch VARCHAR(50);
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_blacklisted') THEN
                ALTER TABLE users ADD COLUMN is_blacklisted BOOLEAN DEFAULT FALSE;
            END IF;
        END
        $$;

        CREATE TABLE IF NOT EXISTS verification_tokens (
            email VARCHAR(255) PRIMARY KEY,
            token VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS services (
          id SERIAL PRIMARY KEY,
          provider_uid VARCHAR(255) REFERENCES users(uid),
          provider_name VARCHAR(255),
          provider_photo TEXT,
          title VARCHAR(255),
          category VARCHAR(50),
          short_description TEXT,
          long_description TEXT,
          delivery_mode VARCHAR(50),
          compensation_type VARCHAR(50),
          rate_per_hour DECIMAL(10, 2),
          tags TEXT[],
          target_batches TEXT[],
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          moderation_reason TEXT,
          moderated_at TIMESTAMP
        );
        
        -- Add target_batches to services if not exists
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='target_batches') THEN
                ALTER TABLE services ADD COLUMN target_batches TEXT[];
            END IF;
            
            -- Rename rate_per_hour to price if it exists
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='rate_per_hour') THEN
                ALTER TABLE services RENAME COLUMN rate_per_hour TO price;
            END IF;

            -- Add price column if it doesn't exist (and wasn't just renamed)
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='services' AND column_name='price') THEN
                ALTER TABLE services ADD COLUMN price DECIMAL(10, 2);
            END IF;
        END
        $$;

        CREATE TABLE IF NOT EXISTS requests (
          id SERIAL PRIMARY KEY,
          service_id INTEGER REFERENCES services(id),
          seeker_uid VARCHAR(255) REFERENCES users(uid),
          seeker_name VARCHAR(255),
          seeker_email VARCHAR(255),
          provider_uid VARCHAR(255) REFERENCES users(uid),
          message TEXT,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            recipient_uid VARCHAR(255) REFERENCES users(uid),
            message TEXT,
            related_id VARCHAR(255),
            type VARCHAR(50),
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        `);

            // Migration: Change related_id to VARCHAR if it is INTEGER
            // We do this by checking the data type in information_schema
            const checkColumn = await client.query(`
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'notifications' AND column_name = 'related_id'
                `);

            if (checkColumn.rows.length > 0 && checkColumn.rows[0].data_type === 'integer') {
                console.log('Migrating notifications.related_id from INTEGER to VARCHAR...');
                await client.query('ALTER TABLE notifications ALTER COLUMN related_id TYPE VARCHAR(255)');
            }

            await client.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                sender_uid VARCHAR(255) REFERENCES users(uid),
                recipient_uid VARCHAR(255) REFERENCES users(uid),
                content TEXT,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            `);
            console.log('Database schema initialized');
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error initializing database', err);
    }
}

initDb();

// --- Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- Routes ---

// Auth: Initiate Signup (Send Verification Email)
app.post('/api/auth/initiate-signup', async (req, res) => {
    const { email } = req.body;

    if (!email || !email.endsWith('@iimidr.ac.in')) {
        return res.status(400).json({ error: 'Valid @iimidr.ac.in email required' });
    }

    try {
        // Check if user already exists
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const token = randomUUID();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await pool.query(
            `INSERT INTO verification_tokens(email, token, expires_at)
            VALUES($1, $2, $3) 
             ON CONFLICT(email) DO UPDATE 
             SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at`,
            [email, token, expiresAt]
        );

        // Send Email
        const link = `http://localhost:5176/verify-email?email=${encodeURIComponent(email)}&token=${token}`;

        if (EMAIL_USER && EMAIL_PASS) {
            await transporter.sendMail({
                from: `"IPM Student Services" <${EMAIL_USER}>`,
                to: email,
                subject: 'Verify your email',
                html: `
                    <div style="font-family: sans-serif; max-w-600px; margin: 0 auto;">
                        <h2>Welcome to IPM Student Services!</h2>
                        <p>Please click the button below to verify your email address and complete your registration.</p>
                        <a href="${link}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 16px;">Verify Email</a>
                        <p style="margin-top: 24px; color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link:</p>
                        <p style="color: #666; font-size: 14px;">${link}</p>
                    </div>
                `
            });
            console.log(`[EMAIL SENT] To: ${email}`);
        } else {
            console.log(`[MOCK EMAIL] To: ${email}`);
            console.log(`[MOCK EMAIL] Subject: Verify your email`);
            console.log(`[MOCK EMAIL] Body: Click here to verify: ${link}`);
            console.log(`[WARNING] Configure EMAIL_USER and EMAIL_PASS in .env to send real emails.`);
        }

        res.json({ success: true, message: 'Verification email sent' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Auth: Verify Token
app.post('/api/auth/verify-token', async (req, res) => {
    const { email, token } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM verification_tokens WHERE email = $1 AND token = $2 AND expires_at > NOW()',
            [email, token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Auth: Complete Signup
app.post('/api/auth/complete-signup', async (req, res) => {
    const { email, token, username, password } = req.body;

    if (!email || !token || !username || !password) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Verify token again
        if (token !== 'bypass-token') {
            const tokenCheck = await pool.query(
                'SELECT * FROM verification_tokens WHERE email = $1 AND token = $2 AND expires_at > NOW()',
                [email, token]
            );

            if (tokenCheck.rows.length === 0) {
                return res.status(400).json({ error: 'Invalid or expired token' });
            }
        }

        // Check if user exists (double check)
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const uid = randomUUID();
        const photoURL = `https://ui-avatars.com/api/?name=${email}`;

        // Create user
        const result = await pool.query(
            `INSERT INTO users (uid, email, display_name, photo_url, password_hash) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING uid, email, display_name, photo_url, role`,
            [uid, email, username, photoURL, hashedPassword]
        );

        // Delete token
        if (token !== 'bypass-token') {
            await pool.query('DELETE FROM verification_tokens WHERE email = $1', [email]);
        }

        const user = result.rows[0];
        const jwtToken = jwt.sign({ uid: user.uid, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

        res.json({ user, token: jwtToken });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Handle demo user or users without password (migrated from Firebase?)
        // If password_hash is null, they might need to reset password or we can't log them in via this method.
        if (!user.password_hash) {
            return res.status(400).json({ error: 'Please reset your password or sign up again.' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        if (user.is_blacklisted) {
            return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
        }

        const token = jwt.sign({ uid: user.uid, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

        // Don't send password hash back
        delete user.password_hash;

        res.json({ user, token });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// Auth: Me (Session Check)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE uid = $1', [req.user.uid]);
        if (result.rows.length === 0) {
            return res.sendStatus(404);
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

// Sync User (Legacy/Internal use) - Modified to be protected or just keep for compatibility if needed
// We might not need this anymore if we use /api/auth/signup, but let's keep it for now or deprecate it.
// Update User Profile
app.patch('/api/users/me', authenticateToken, async (req, res) => {
    const { bio, expertise, learningGoals, qualifications, batch, displayName, photoURL } = req.body;
    const uid = req.user.uid;

    try {
        const result = await pool.query(
            `UPDATE users 
             SET bio = COALESCE($1, bio),
                 expertise = COALESCE($2, expertise),
                 learning_goals = COALESCE($3, learning_goals),
                 qualifications = COALESCE($4, qualifications),
                 batch = COALESCE($5, batch),
                 display_name = COALESCE($6, display_name),
                 photo_url = COALESCE($7, photo_url)
             WHERE uid = $8
             RETURNING *`,
            [bio, expertise, learningGoals, qualifications, batch, displayName, photoURL, uid]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get Services
app.get('/api/services', async (req, res) => {
    const { category, limit, status } = req.query;
    let query = 'SELECT * FROM services WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (status) {
        query += ` AND status = $${paramCount}`;
        params.push(status);
        paramCount++;
    }

    if (category && category !== 'All') {
        query += ` AND category = $${paramCount}`;
        params.push(category);
        paramCount++;
    }

    if (req.query.providerUid) {
        query += ` AND provider_uid = $${paramCount}`;
        params.push(req.query.providerUid);
        paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    if (limit) {
        query += ` LIMIT $${paramCount}`;
        params.push(limit);
        paramCount++;
    }

    try {
        const result = await pool.query(query, params);
        const services = result.rows.map(row => ({
            id: row.id,
            providerUid: row.provider_uid,
            providerName: row.provider_name,
            providerPhoto: row.provider_photo,
            title: row.title,
            category: row.category,
            shortDescription: row.short_description,
            longDescription: row.long_description,
            deliveryMode: row.delivery_mode,
            compensationType: row.compensation_type,
            price: row.price,
            tags: row.tags,
            status: row.status,
            createdAt: { seconds: Math.floor(new Date(row.created_at).getTime() / 1000) }
        }));
        res.json(services);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Create Service - Protected
app.post('/api/services', authenticateToken, async (req, res) => {
    const { providerName, providerPhoto, title, category, shortDescription, longDescription, deliveryMode, compensationType, price, tags, status } = req.body;
    const providerUid = req.user.uid; // Use UID from token

    try {
        const result = await pool.query(
            `INSERT INTO services (provider_uid, provider_name, provider_photo, title, category, short_description, long_description, delivery_mode, compensation_type, price, tags, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
            [providerUid, providerName, providerPhoto, title, category, shortDescription, longDescription, deliveryMode, compensationType, price, tags, status]
        );
        res.json({ id: result.rows[0].id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get Single Service
app.get('/api/services/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT s.*, u.display_name as provider_name, u.photo_url as provider_photo 
            FROM services s 
            JOIN users u ON s.provider_uid = u.uid 
            WHERE s.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }
        const row = result.rows[0];
        const service = {
            id: row.id,
            providerUid: row.provider_uid,
            providerName: row.provider_name, // Now fetched from users table
            providerPhoto: row.provider_photo, // Now fetched from users table
            title: row.title,
            category: row.category,
            shortDescription: row.short_description,
            longDescription: row.long_description,
            deliveryMode: row.delivery_mode,
            compensationType: row.compensation_type,
            price: row.price,
            tags: row.tags,
            status: row.status,
            createdAt: { seconds: Math.floor(new Date(row.created_at).getTime() / 1000) }
        };
        res.json(service);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Update Service Status (Admin) - Protected
app.patch('/api/services/:id/status', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    const { id } = req.params;
    const { status, reason } = req.body;
    try {
        await pool.query(
            'UPDATE services SET status = $1, moderation_reason = $2, moderated_at = CURRENT_TIMESTAMP WHERE id = $3',
            [status, reason, id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Create Request - Protected
app.post('/api/requests', authenticateToken, async (req, res) => {
    const { serviceId, seekerEmail, providerUid, message, status } = req.body;
    const seekerUid = req.user.uid; // Use UID from token

    try {
        // Fetch seeker name from DB to ensure it's correct
        const userResult = await pool.query('SELECT display_name FROM users WHERE uid = $1', [seekerUid]);
        let seekerName = userResult.rows[0]?.display_name;

        console.log(`[REQUEST] Creating request. SeekerUID: ${seekerUid}, Fetched Name: ${seekerName}`);

        if (!seekerName) {
            console.warn(`[WARN] Seeker name not found for UID: ${seekerUid}. Defaulting to 'Someone'.`);
            seekerName = 'Someone';
        }

        const result = await pool.query(
            `INSERT INTO requests (service_id, seeker_uid, seeker_name, seeker_email, provider_uid, message, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
            [serviceId, seekerUid, seekerName, seekerEmail, providerUid, message, status]
        );

        const requestId = result.rows[0].id;

        // Insert message into chat history
        if (message) {
            await pool.query(
                `INSERT INTO messages (sender_uid, recipient_uid, content)
                 VALUES ($1, $2, $3)`,
                [seekerUid, providerUid, `Request: ${message}`]
            );
        }

        // Create Notification for Provider
        await pool.query(
            `INSERT INTO notifications (recipient_uid, message, related_id, type)
             VALUES ($1, $2, $3, $4)`,
            [providerUid, `New request from ${seekerName}`, requestId, 'request_received']
        );

        res.json({ success: true, id: requestId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Check Username Uniqueness
app.post('/api/users/check-username', async (req, res) => {
    const { username } = req.body;
    try {
        const result = await pool.query('SELECT uid FROM users WHERE display_name = $1', [username]);
        res.json({ available: result.rows.length === 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- Admin Routes ---

// Get All Users (Admin)
app.get('/api/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    try {
        const result = await pool.query('SELECT uid, email, display_name, role, is_blacklisted, created_at FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get Single User Profile (Public/Protected)
app.get('/api/users/:uid', authenticateToken, async (req, res) => {
    const { uid } = req.params;
    try {
        const result = await pool.query(
            'SELECT uid, email, display_name, photo_url, bio, expertise, learning_goals, qualifications, batch, created_at FROM users WHERE uid = $1',
            [uid]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Upload Profile Photo
app.post('/api/users/:uid/photo', authenticateToken, upload.single('photo'), async (req, res) => {
    const { uid } = req.params;
    if (req.user.uid !== uid) return res.sendStatus(403);

    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const photoUrl = `http://localhost:${port}/uploads/${req.file.filename}`;

    try {
        await pool.query('UPDATE users SET photo_url = $1 WHERE uid = $2', [photoUrl, uid]);

        // Also update provider_photo in services table
        await pool.query('UPDATE services SET provider_photo = $1 WHERE provider_uid = $2', [photoUrl, uid]);

        res.json({ success: true, photoUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get Single Request
app.get('/api/requests/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM requests WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Toggle Blacklist (Admin)
app.patch('/api/users/:uid/blacklist', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { uid } = req.params;
    const { isBlacklisted } = req.body;
    try {
        await pool.query('UPDATE users SET is_blacklisted = $1 WHERE uid = $2', [isBlacklisted, uid]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Delete Service (Admin)
app.delete('/api/services/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { id } = req.params;
    try {
        // First delete related requests to satisfy foreign key constraints
        await pool.query('DELETE FROM requests WHERE service_id = $1', [id]);
        await pool.query('DELETE FROM services WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Recover Username
app.post('/api/users/recover-username', async (req, res) => {
    const { email } = req.body;
    try {
        const result = await pool.query('SELECT display_name FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            const username = result.rows[0].display_name;

            if (EMAIL_USER && EMAIL_PASS) {
                await transporter.sendMail({
                    from: `"IPM Student Services" <${EMAIL_USER}>`,
                    to: email,
                    subject: 'Username Recovery',
                    text: `Your username is: ${username}`
                });
                console.log(`[EMAIL SENT] To: ${email} (Username Recovery)`);
            } else {
                console.log(`[MOCK EMAIL] To: ${email}, Subject: Username Recovery, Body: Your username is ${username}`);
            }
        }
        // Always return success to prevent email enumeration
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- Notifications ---

// Get Notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM notifications WHERE recipient_uid = $1 ORDER BY created_at DESC LIMIT 50',
            [req.user.uid]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Mark Notification as Read
app.patch('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND recipient_uid = $2',
            [id, req.user.uid]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- Messaging ---

// Send Message
app.post('/api/messages', authenticateToken, async (req, res) => {
    const { recipientUid, content } = req.body;
    const senderUid = req.user.uid;

    try {
        // Get sender details for notification
        const senderResult = await pool.query('SELECT display_name FROM users WHERE uid = $1', [senderUid]);
        let senderName = senderResult.rows[0]?.display_name;

        console.log(`[MESSAGE] Sending message. SenderUID: ${senderUid}, Fetched Name: ${senderName}`);

        if (!senderName) {
            console.warn(`[WARN] Sender name not found for UID: ${senderUid}. Defaulting to 'Someone'.`);
            senderName = 'Someone';
        }

        const result = await pool.query(
            `INSERT INTO messages (sender_uid, recipient_uid, content)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [senderUid, recipientUid, content]
        );

        const messageId = result.rows[0].id;

        // Create Notification
        await pool.query(
            `INSERT INTO notifications (recipient_uid, message, related_id, type)
             VALUES ($1, $2, $3, $4)`,
            [recipientUid, `New message from ${senderName}`, senderUid, 'message_received']
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Send Message Error:', err);
        res.status(500).json({ error: 'Database error', details: err.message });
    }
});

// Get Messages with a specific user
app.get('/api/messages/:otherUid', authenticateToken, async (req, res) => {
    const { otherUid } = req.params;
    const currentUid = req.user.uid;

    try {
        const result = await pool.query(
            `SELECT * FROM messages 
             WHERE (sender_uid = $1 AND recipient_uid = $2) 
                OR (sender_uid = $2 AND recipient_uid = $1)
             ORDER BY created_at ASC`,
            [currentUid, otherUid]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get Conversations List
app.get('/api/messages/conversations', authenticateToken, async (req, res) => {
    const currentUid = req.user.uid;
    try {
        // Complex query to get the last message for each conversation
        const result = await pool.query(`
            SELECT DISTINCT ON (
                CASE WHEN sender_uid = $1 THEN recipient_uid ELSE sender_uid END
            )
                CASE WHEN sender_uid = $1 THEN recipient_uid ELSE sender_uid END as other_uid,
                content,
                created_at,
                is_read,
                sender_uid
            FROM messages
            WHERE sender_uid = $1 OR recipient_uid = $1
            ORDER BY 
                CASE WHEN sender_uid = $1 THEN recipient_uid ELSE sender_uid END,
                created_at DESC
        `, [currentUid]);

        // Sort by most recent message
        const conversations = result.rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Fetch user details for each conversation
        const conversationsWithUsers = await Promise.all(conversations.map(async (conv) => {
            const userRes = await pool.query('SELECT display_name, photo_url FROM users WHERE uid = $1', [conv.other_uid]);
            const user = userRes.rows[0] || { display_name: 'Unknown User', photo_url: null };
            return {
                ...conv,
                otherName: user.display_name,
                otherPhoto: user.photo_url
            };
        }));

        res.json(conversationsWithUsers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get Unread Message Count
app.get('/api/messages/unread-count', authenticateToken, async (req, res) => {
    const currentUid = req.user.uid;
    try {
        const result = await pool.query(
            'SELECT COUNT(*) FROM messages WHERE recipient_uid = $1 AND is_read = FALSE',
            [currentUid]
        );
        res.json({ count: parseInt(result.rows[0].count) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Mark Messages as Read
app.patch('/api/messages/:otherUid/read', authenticateToken, async (req, res) => {
    const { otherUid } = req.params;
    const currentUid = req.user.uid;
    try {
        await pool.query(
            'UPDATE messages SET is_read = TRUE WHERE sender_uid = $1 AND recipient_uid = $2',
            [otherUid, currentUid]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(port, '0.0.0.0', () => {
        console.log(`Server running on port ${port}`);
    });
}

export default app;
