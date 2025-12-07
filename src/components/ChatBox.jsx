import { useState, useEffect, useRef } from 'react';
import { Send, Smile } from 'lucide-react';
import { getMessages, sendMessage, markMessagesRead } from '../lib/api';

export default function ChatBox({ currentUser, otherUser, isWidget = false }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        let interval;
        async function fetchMessages() {
            try {
                console.log(`[ChatBox] Fetching messages with ${otherUser.uid}`);
                const data = await getMessages(otherUser.uid);
                setMessages(data);
                setLoading(false);

                // Only mark as read if there are unread messages from the other user
                const hasUnread = data.some(m => !m.is_read && m.sender_uid === otherUser.uid);
                if (hasUnread) {
                    console.log('[ChatBox] Marking messages as read...');
                    await markMessagesRead(otherUser.uid);
                }

                scrollToBottom();
            } catch (error) {
                console.error("Failed to fetch messages", error);
            }
        }

        if (currentUser && otherUser) {
            fetchMessages();
            interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
        }

        return () => clearInterval(interval);
    }, [currentUser, otherUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const sentMessage = await sendMessage({
                recipientUid: otherUser.uid,
                content: newMessage
            });
            setMessages([...messages, sentMessage]);
            setNewMessage("");
        } catch (error) {
            console.error("Failed to send message", error);
            alert("Failed to send message.");
        }
    };

    // Helper to detect links
    const renderMessage = (text) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.split(urlRegex).map((part, i) => {
            if (part.match(urlRegex)) {
                return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">{part}</a>;
            }
            return part;
        });
    };

    if (!currentUser) return <div className="text-center p-4">Please sign in to chat.</div>;

    return (
        <div className={`flex flex-col bg-white ${isWidget ? 'h-full' : 'h-[500px] border border-slate-200 rounded-lg shadow-sm'}`}>
            {/* Header - Only show if not a widget (widget has its own header) */}
            {!isWidget && (
                <div className="px-4 py-3 border-b border-slate-200 flex items-center bg-slate-50 rounded-t-lg">
                    <img
                        className="h-8 w-8 rounded-full bg-slate-200"
                        src={otherUser.photoUrl || `https://ui-avatars.com/api/?name=${otherUser.displayName || "User"}`}
                        alt=""
                    />
                    <div className="ml-3">
                        <p className="text-sm font-medium text-slate-900">{otherUser.displayName}</p>
                        <p className="text-xs text-slate-500">Online</p>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {loading ? (
                    <div className="text-center text-slate-500 text-sm">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-slate-500 text-sm mt-10">No messages yet. Say hi! 👋</div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_uid === currentUser.uid;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] rounded-lg px-4 py-2 text-sm shadow-sm ${isMe ? 'bg-indigo-600 text-white' : 'bg-white text-slate-900 border border-slate-200'
                                    }`}>
                                    <p>{renderMessage(msg.content)}</p>
                                    <p className={`text-[10px] mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className={`p-3 border-t border-slate-200 bg-white ${!isWidget ? 'rounded-b-lg' : ''}`}>
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}
