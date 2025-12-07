import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Menu, X, Bell, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { getNotifications, markNotificationRead, getUserProfile, getRequest, getUnreadMessageCount } from "../lib/api";
import { useChat } from "../context/ChatContext";

export default function Navbar() {
    const { currentUser, login, logout } = useAuth();
    const { openChat } = useChat();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);

    useEffect(() => {
        if (currentUser) {
            fetchNotifications();
            fetchUnreadMessages();
            // Poll for notifications every 5 seconds
            const interval = setInterval(() => {
                fetchNotifications();
                fetchUnreadMessages();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [currentUser]);

    async function fetchUnreadMessages() {
        try {
            const data = await getUnreadMessageCount();
            setUnreadMessageCount(data.count);
        } catch (error) {
            console.error("Failed to fetch unread messages", error);
            if (error.message && error.message.includes('403')) {
                logout();
                window.location.href = '/blacklisted';
            }
        }
    }

    async function fetchNotifications() {
        try {
            const data = await getNotifications();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
            // Check if error is 403 (Forbidden) - likely blacklisted
            if (error.message && error.message.includes('403')) {
                logout();
                window.location.href = '/blacklisted';
            }
        }
    }

    const handleNotificationClick = async (notification) => {
        if (!notification.is_read) {
            try {
                await markNotificationRead(notification.id);
                setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error("Failed to mark notification as read", error);
            }
        }

        if (notification.type === 'message_received') {
            try {
                const user = await getUserProfile(notification.related_id);
                if (user) {
                    openChat({
                        uid: user.uid,
                        displayName: user.display_name,
                        photoUrl: user.photo_url
                    });
                }
            } catch (error) {
                console.error("Failed to open chat from notification", error);
            }
        }

        if (notification.type === 'request_received') {
            try {
                // Fetch request details to get seekerUid
                const request = await getRequest(notification.related_id);
                if (request) {
                    const user = await getUserProfile(request.seeker_uid);
                    if (user) {
                        // Navigate to profile
                        window.location.href = `/profile/${user.uid}`;

                        openChat({
                            uid: user.uid,
                            displayName: user.display_name,
                            photoUrl: user.photo_url
                        });
                    }
                }
            } catch (error) {
                console.error("Failed to open chat from request notification", error);
            }
        }
    };

    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center">
                            <span className="text-2xl font-bold text-indigo-600">IPM SkillCircle</span>
                        </Link>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link to={currentUser ? "/dashboard" : "/"} className="border-transparent text-slate-500 hover:border-indigo-500 hover:text-slate-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                Home
                            </Link>
                            <Link to="/directory" className="border-transparent text-slate-500 hover:border-indigo-500 hover:text-slate-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                Directory
                            </Link>
                            {currentUser && currentUser.role === 'admin' && (
                                <Link to="/admin" className="border-transparent text-indigo-600 hover:border-indigo-700 hover:text-indigo-800 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Admin Dashboard
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:items-center">
                        {currentUser ? (
                            <div className="flex items-center space-x-4">
                                <Link to="/create-listing" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors">
                                    Post Service
                                </Link>

                                {/* Chat Icon */}
                                <Link to="/messages" className="relative p-1 rounded-full text-slate-400 hover:text-slate-500 focus:outline-none">
                                    <MessageSquare className="h-6 w-6" />
                                    {unreadMessageCount > 0 && (
                                        <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500" />
                                    )}
                                </Link>

                                {/* Notification Bell */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        className="p-1 rounded-full text-slate-400 hover:text-slate-500 focus:outline-none relative"
                                    >
                                        <Bell className="h-6 w-6" />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500" />
                                        )}
                                    </button>

                                    {showNotifications && (
                                        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                            <div className="px-4 py-2 border-b border-slate-100 font-medium text-slate-700">Notifications</div>
                                            <div className="max-h-96 overflow-y-auto">
                                                {notifications.length > 0 ? (
                                                    notifications.map((notification) => (
                                                        <div
                                                            key={notification.id}
                                                            onClick={() => handleNotificationClick(notification)}
                                                            className={`px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 ${!notification.is_read ? 'bg-indigo-50' : ''}`}
                                                        >
                                                            <p className="text-sm text-slate-800">{notification.message}</p>
                                                            <p className="text-xs text-slate-500 mt-1">{new Date(notification.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-3 text-sm text-slate-500 text-center">No notifications</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="relative ml-3">
                                    <div className="flex items-center space-x-2 cursor-pointer group">
                                        <Link to="/profile">
                                            <img
                                                className="h-8 w-8 rounded-full bg-slate-100"
                                                src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.email}`}
                                                alt=""
                                            />
                                        </Link>
                                        <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-700">
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex space-x-2">

                                <Link
                                    to="/login"
                                    className="text-slate-500 hover:text-indigo-600 font-medium px-3 py-2"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/signup"
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                    <div className="-mr-2 flex items-center sm:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {isMenuOpen && (
                <div className="sm:hidden">
                    <div className="pt-2 pb-3 space-y-1">
                        <Link to={currentUser ? "/dashboard" : "/"} className="bg-indigo-50 border-indigo-500 text-indigo-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                            Home
                        </Link>
                        <Link to="/directory" className="border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                            Directory
                        </Link>
                        {currentUser && currentUser.role === 'admin' && (
                            <Link to="/admin" className="border-transparent text-indigo-600 hover:bg-indigo-50 hover:border-indigo-600 hover:text-indigo-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                                Admin Dashboard
                            </Link>
                        )}
                    </div>
                    <div className="pt-4 pb-4 border-t border-slate-200">
                        {currentUser ? (
                            <div className="flex items-center px-4">
                                <div className="flex-shrink-0">
                                    <img
                                        className="h-10 w-10 rounded-full"
                                        src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.email}`}
                                        alt=""
                                    />
                                </div>
                                <div className="ml-3">
                                    <div className="text-base font-medium text-slate-800">{currentUser.displayName || currentUser.email}</div>
                                    <div className="text-sm font-medium text-slate-500">{currentUser.email}</div>
                                </div>
                                <button
                                    onClick={logout}
                                    className="ml-auto bg-white flex-shrink-0 p-1 rounded-full text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="mt-3 space-y-1">
                                <Link
                                    to="/login"
                                    className="block w-full text-left px-4 py-2 text-base font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/signup"
                                    className="block w-full text-left px-4 py-2 text-base font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}
