import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ChatWidget from "./ChatWidget";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
    const { error } = useAuth();

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <Navbar />
            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            {/* Icon could go here */}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">
                                {error}
                            </p>
                        </div>
                    </div>
                </div>
            )}
            <main className="flex-grow">
                <Outlet />
            </main>
            <Footer />
            <ChatWidget />
        </div>
    );
}
