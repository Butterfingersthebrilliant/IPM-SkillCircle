import pg from 'pg';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const connectionString = 'postgresql://neondb_owner:npg_Yx6gXMW7uetS@ep-purple-hall-ad8krrw5-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({
    connectionString,
});

async function seedAdmin() {
    const email = 'admin@iimidr.ac.in';
    const password = 'AdminPassword123!';
    const username = 'System Admin';

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const uid = randomUUID();
        const photoURL = `https://ui-avatars.com/api/?name=${email}`;

        // Check if exists first
        const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (check.rows.length > 0) {
            console.log('Admin user already exists. Updating role and password...');
            await pool.query(
                'UPDATE users SET role = $1, password_hash = $2 WHERE email = $3',
                ['admin', hashedPassword, email]
            );
        } else {
            console.log('Creating new admin user...');
            await pool.query(
                `INSERT INTO users (uid, email, display_name, photo_url, role, password_hash) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [uid, email, username, photoURL, 'admin', hashedPassword]
            );
        }

        console.log('Admin user seeded successfully.');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    } catch (err) {
        console.error('Error seeding admin:', err);
    } finally {
        await pool.end();
    }
}

seedAdmin();
