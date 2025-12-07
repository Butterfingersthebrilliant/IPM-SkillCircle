import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function SignUp() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!email.endsWith("@iimidr.ac.in")) {
            setError("Email must be an @iimidr.ac.in address.");
            return;
        }

        // BYPASS: Go directly to complete profile
        navigate(`/complete-profile?email=${encodeURIComponent(email)}&token=bypass-token`);

        /* 
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/auth/initiate-signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage("Verification link sent! Check your email (and the console for now).");
            } else {
                setError(data.error || "Failed to send verification email.");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
        */
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
                    Create your account
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Or{" "}
                    <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                        sign in to existing account
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {message ? (
                        <div className="bg-green-50 border-l-4 border-green-400 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm text-green-700">{message}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                                    <div className="flex">
                                        <div className="ml-3">
                                            <p className="text-sm text-red-700">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                                        Email address (@iimidr.ac.in)
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        {loading ? "Sending Link..." : "Send Verification Link"}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
