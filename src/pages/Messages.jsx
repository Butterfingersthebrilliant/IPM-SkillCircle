import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUserProfile } from "../lib/api";
import ChatBox from "../components/ChatBox";

export default function Messages() {
    const { uid } = useParams();
    const { currentUser } = useAuth();
    const [otherUser, setOtherUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadUser() {
            if (!uid) return;
            try {
                const user = await getUserProfile(uid);
                if (user) {
                    setOtherUser({
                        uid: user.uid,
                        displayName: user.display_name,
                        photoUrl: user.photo_url
                    });
                }
            } catch (error) {
                console.error("Failed to load user for chat", error);
            } finally {
                setLoading(false);
            }
        }

        loadUser();
    }, [uid]);

    if (loading) return <div className="p-8 text-center">Loading chat...</div>;
    if (!otherUser) return <div className="p-8 text-center">User not found.</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Chat with {otherUser.displayName}</h1>
            <ChatBox currentUser={currentUser} otherUser={otherUser} />
        </div>
    );
}
