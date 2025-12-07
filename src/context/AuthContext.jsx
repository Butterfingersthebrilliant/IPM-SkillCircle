import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:3000/api";

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function signup(email, password, username) {
        setError("");
        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, username })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to sign up');

            localStorage.setItem('token', data.token);
            setCurrentUser(data.user);
            return data.user;
        } catch (err) {
            console.error("Signup failed", err);
            throw err;
        }
    }

    async function login(email, password) {
        setError("");
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to sign in');

            localStorage.setItem('token', data.token);
            setCurrentUser(data.user);
            return data.user;
        } catch (err) {
            console.error("Login failed", err);
            throw err;
        }
    }

    function logout() {
        localStorage.removeItem('token');
        setCurrentUser(null);
        return Promise.resolve();
    }

    // Check if user is logged in on mount
    useEffect(() => {
        async function checkUser() {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_URL}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const user = await response.json();
                    setCurrentUser(user);
                } else {
                    localStorage.removeItem('token');
                    setCurrentUser(null);
                }
            } catch (err) {
                console.error("Session check failed", err);
                localStorage.removeItem('token');
                setCurrentUser(null);
            } finally {
                setLoading(false);
            }
        }

        checkUser();
    }, []);

    const value = {
        currentUser,
        login,
        signup,
        logout,
        updateUser: setCurrentUser,
        error
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
