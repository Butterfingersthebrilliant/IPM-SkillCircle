import { AlertTriangle, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Blacklisted() {
    const { logout } = useAuth();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center border border-slate-200">
                <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-2">Account Suspended</h1>

                <p className="text-slate-600 mb-6">
                    Your account has been suspended due to a violation of our terms of service.
                    You can no longer access the platform.
                </p>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 text-left">
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">What can you do?</h3>
                    <p className="text-sm text-slate-600 mb-2">
                        If you believe this is a mistake, please contact our support team for a review of your case.
                    </p>
                    <a href="mailto:support@ipmskillcircle.com" className="flex items-center text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                        <Mail className="h-4 w-4 mr-2" />
                        support@ipmskillcircle.com
                    </a>
                </div>

                <button
                    onClick={logout}
                    className="w-full bg-slate-900 text-white py-2 px-4 rounded-lg hover:bg-slate-800 transition-colors"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}
