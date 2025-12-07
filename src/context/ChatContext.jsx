import { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export function useChat() {
    return useContext(ChatContext);
}

export function ChatProvider({ children }) {
    const [activeChatUser, setActiveChatUser] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    const openChat = (user) => {
        setActiveChatUser(user);
        setIsOpen(true);
    };

    const closeChat = () => {
        setIsOpen(false);
        setActiveChatUser(null);
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const value = {
        activeChatUser,
        isOpen,
        openChat,
        closeChat,
        toggleChat
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
}
