import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getConversations } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function ChatList() {
    const { currentUser } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchConversations() {
            try {
                const data = await getConversations();
                setConversations(data);
            } catch (error) {
                console.error("Failed to fetch conversations", error);
            } finally {
                setLoading(false);
            }
        }

        if (currentUser) {
            fetchConversations();
        }
    }, [currentUser]);

    if (loading) return <div className="p-8 text-center">Loading conversations...</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Messages</h1>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-slate-200">
                    {conversations.length > 0 ? (
                        conversations.map((conv) => (
                            <li key={conv.other_uid}>
                                <Link to={`/messages/${conv.other_uid}`} className="block hover:bg-slate-50 transition duration-150 ease-in-out">
                                    <div className="px-4 py-4 sm:px-6 flex items-center">
                                        <div className="flex-shrink-0 mr-4">
                                            <img
                                                className="h-12 w-12 rounded-full"
                                                src={conv.otherPhoto || `https://ui-avatars.com/api/?name=${conv.otherName}`}
                                                alt={conv.otherName}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-indigo-600 truncate">{conv.otherName}</p>
                                                <div className="ml-2 flex-shrink-0 flex">
                                                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                                                        {new Date(conv.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex justify-between">
                                                <div className="sm:flex">
                                                    <p className={`flex items-center text-sm ${!conv.is_read && conv.sender_uid !== currentUser.uid ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                                                        {conv.content.length > 50 ? conv.content.substring(0, 50) + '...' : conv.content}
                                                    </p>
                                                </div>
                                                {!conv.is_read && conv.sender_uid !== currentUser.uid && (
                                                    <div className="ml-2 flex-shrink-0 flex">
                                                        <span className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-indigo-600" aria-hidden="true" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-500">
                            No messages yet. Start a conversation from the Directory!
                        </div>
                    )}
                </ul>
            </div>
        </div>
    );
}
