import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import ChatBox from "./ChatBox";
import { X, Minimize2 } from "lucide-react";

export default function ChatWidget() {
    const { activeChatUser, isOpen, closeChat, toggleChat } = useChat();
    const { currentUser } = useAuth();

    if (!currentUser || !activeChatUser || !isOpen) return null;

    return (
        <div className="fixed bottom-4 right-4 w-80 z-50 shadow-xl rounded-lg overflow-hidden border border-slate-200 bg-white flex flex-col">
            <div className="bg-indigo-600 p-3 flex justify-between items-center text-white">
                <div className="flex items-center space-x-2">
                    <div className="relative">
                        <img
                            src={activeChatUser.photoUrl || `https://ui-avatars.com/api/?name=${activeChatUser.displayName}`}
                            alt=""
                            className="h-8 w-8 rounded-full bg-indigo-500"
                        />
                        <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full ring-2 ring-indigo-600 bg-green-400" />
                    </div>
                    <span className="font-medium text-sm truncate max-w-[150px]">{activeChatUser.displayName}</span>
                </div>
                <div className="flex items-center space-x-1">
                    <button onClick={closeChat} className="p-1 hover:bg-indigo-700 rounded transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
            <div className="h-96">
                <ChatBox currentUser={currentUser} otherUser={activeChatUser} isWidget={true} />
            </div>
        </div>
    );
}
