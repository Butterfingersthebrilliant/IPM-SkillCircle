import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:3000/api";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("verifying"); // verifying, success, error
    const [message, setMessage] = useState("Verifying your email...");

    useEffect(() => {
        const token = searchParams.get("token");
        const email = searchParams.get("email");

        if (!token || !email) {
            setStatus("error");
            setMessage("Invalid verification link.");
            return;
        }

        verifyToken(email, token);
    }, [searchParams]);

    async function verifyToken(email, token) {
        try {
            const response = await fetch(`${API_URL}/auth/verify-token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, token })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus("success");
                setMessage("Email verified successfully! Redirecting...");
                setTimeout(() => {
                    navigate(`/complete-profile?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);
                }, 2000);
            } else {
                setStatus("error");
                setMessage(data.error || "Verification failed.");
            }
        } catch (error) {
            setStatus("error");
            setMessage("An error occurred. Please try again.");
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                    <h2 className="text-2xl font-bold mb-4">Email Verification</h2>
                    <p className={`text-lg ${status === "error" ? "text-red-600" : "text-slate-600"}`}>
                        {message}
                    </p>
                </div>
            </div>
        </div>
    );
}
