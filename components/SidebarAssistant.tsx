"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bot, User, Send, Loader2, ArrowLeft, MessageSquarePlus, Trash2, MoreVertical, Edit2 } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

type Message = {
    uuid: string;
    role: "system" | "user" | "assistant";
    content: string;
    created_at: string;
};

type Chat = {
    uuid: string;
    title: string;
    last_updated: string;
};

export default function SidebarAssistant() {
    const [viewMode, setViewMode] = useState<'chat' | 'list'>('chat');
    const [chatList, setChatList] = useState<Chat[]>([]);
    const [chatId, setChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSwitchingChat, setIsSwitchingChat] = useState(false);
    const [loadingChatId, setLoadingChatId] = useState<string | null>(null);
    const [messageCache, setMessageCache] = useState<Record<string, Message[]>>({});
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenDropdownId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // Load saved input text from localStorage on mount
    useEffect(() => {
        const savedText = localStorage.getItem("sidebarAssistantInputText");
        if (savedText) {
            setInputText(savedText);
        }
    }, []);

    // Save input text to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("sidebarAssistantInputText", inputText);
    }, [inputText]);

    // Fetch the list of chats
    const fetchChatList = async () => {
        try {
            const res = await fetch('/api/chat?limit=50');
            if (res.ok) {
                const json = await res.json();
                setChatList(json.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch chat list:", error);
        }
    };

    // Initialize or load chat list
    useEffect(() => {
        const init = async () => {
            try {
                const res = await fetch('/api/chat?limit=10');
                if (res.ok) {
                    const json = await res.json();
                    setChatList(json.data || []);

                    if (json.data && json.data.length > 0) {
                        setChatId(json.data[0].uuid);
                    } else {
                        // Create a new session if user has 0 chats
                        createNewChat();
                    }
                }
            } catch (error) {
                console.error("Initialization error:", error);
            }
        };
        init();
    }, []);

    // Message fetching is now primarily handled by handleChatClick and createNewChat
    // to allow list view spinners, but we maintain this for initial load if needed
    useEffect(() => {
        const loadMessages = async () => {
            if (!chatId || viewMode === 'list') return;

            if (messageCache[chatId]) {
                setMessages(messageCache[chatId]);
                return;
            }

            // Load from localStorage immediately for fast UI
            const localSaved = localStorage.getItem(`chat_messages_${chatId}`);
            if (localSaved) {
                try {
                    const parsed = JSON.parse(localSaved);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setMessages(parsed);
                    }
                } catch (e) {
                    console.error("Failed to parse local messages", e);
                }
            } else {
                setMessages([]);
            }

            setIsSwitchingChat(true);
            try {
                const msgRes = await fetch(`/api/message?chatId=${chatId}&limit=100`);
                if (msgRes.ok) {
                    const msgJson = await msgRes.json();
                    let fetchedMessages = msgJson.data;

                    if (fetchedMessages.length === 0) {
                        fetchedMessages = [{
                            uuid: 'welcome-msg',
                            role: 'assistant',
                            content: 'Hello! How can I help you organize your schedule today?',
                            created_at: new Date().toISOString()
                        }];
                    }

                    setMessages(fetchedMessages);
                    setMessageCache(prev => ({ ...prev, [chatId]: fetchedMessages }));
                    localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(fetchedMessages));
                }
            } catch (error) {
                console.error("Failed to fetch messages:", error);
            } finally {
                setIsSwitchingChat(false);
            }
        };
        loadMessages();
    }, [chatId, viewMode, messageCache]);

    // Save messages to localStorage whenever they change
    useEffect(() => {
        if (chatId && messages.length > 0) {
            localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(messages));
        }
    }, [chatId, messages]);

    const createNewChat = async () => {
        setIsLoading(true);
        try {
            const createRes = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'New Assistant Session' })
            });
            if (createRes.ok) {
                const newChatJson = await createRes.json();
                const newChat = newChatJson.chat;
                setChatList(prev => [newChat, ...prev]);
                setChatId(newChat.uuid);
                setViewMode('chat');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (viewMode === 'chat') {
            scrollToBottom();
        }
    }, [messages, viewMode]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || !chatId || isLoading) return;

        const newUserMessage: Message = {
            uuid: Date.now().toString(),
            role: "user",
            content: inputText,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, newUserMessage]);
        setInputText("");
        localStorage.removeItem("sidebarAssistantInputText");
        setIsLoading(true);

        try {
            // Send message to the AI endpoint — handles Gemini, function calls, and DB persistence
            const res = await fetch(`/api/message/item/${chatId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newUserMessage.content })
            });

            if (res.ok) {
                const json = await res.json();

                // Build the assistant reply from the AI response
                const aiReply: Message = {
                    uuid: Date.now().toString() + '-ai',
                    role: 'assistant',
                    content: json.data,
                    created_at: new Date().toISOString()
                };

                setMessages(prev => [...prev, aiReply]);

                // Update cache so navigating away and back keeps the new messages
                setMessageCache(prev => {
                    const existing = prev[chatId] || [];
                    return { ...prev, [chatId]: [...existing, newUserMessage, aiReply] };
                });

                // Trigger calendar refresh in case the AI created/modified events
                window.dispatchEvent(new Event('calendar-refresh'));
            } else {
                const errJson = await res.json().catch(() => null);
                console.error("AI response error:", errJson?.error || res.statusText);
            }
        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackClick = () => {
        // No need to refetch chat list here since it's already cached in state
        setViewMode('list');
    };

    const handleChatClick = async (id: string) => {
        if (messageCache[id]) {
            setMessages(messageCache[id]);
            setChatId(id);
            setViewMode('chat');
            return;
        }

        const localSaved = localStorage.getItem(`chat_messages_${id}`);
        if (localSaved) {
            try {
                const parsed = JSON.parse(localSaved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setMessages(parsed);
                    setChatId(id);
                    setViewMode('chat');

                    // fetch in background to sync messageCache without blocking UI
                    fetch(`/api/message?chatId=${id}&limit=100`)
                        .then(res => res.ok ? res.json() : Promise.reject())
                        .then(json => {
                            let fetched = json.data;
                            if (fetched.length === 0) {
                                fetched = [{
                                    uuid: 'welcome-msg',
                                    role: 'assistant',
                                    content: 'Hello! How can I help you organize your schedule today?',
                                    created_at: new Date().toISOString()
                                }];
                            }
                            setMessageCache(prev => ({ ...prev, [id]: fetched }));
                            setMessages(prev => (prev[0]?.uuid === parsed[0]?.uuid && prev.length === parsed.length) ? fetched : prev);
                            localStorage.setItem(`chat_messages_${id}`, JSON.stringify(fetched));
                        })
                        .catch(e => console.error("Background sync failed", e));
                    return;
                }
            } catch (e) {
                console.error("Failed to parse local messages", e);
            }
        }

        // Fetch messages before switching view to show spinner on the list item
        setLoadingChatId(id);

        try {
            const msgRes = await fetch(`/api/message?chatId=${id}&limit=100`);
            if (msgRes.ok) {
                const msgJson = await msgRes.json();
                let fetchedMessages = msgJson.data;

                if (fetchedMessages.length === 0) {
                    fetchedMessages = [{
                        uuid: 'welcome-msg',
                        role: 'assistant',
                        content: 'Hello! How can I help you organize your schedule today?',
                        created_at: new Date().toISOString()
                    }];
                }

                setMessages(fetchedMessages);
                setMessageCache(prev => ({ ...prev, [id]: fetchedMessages }));
                localStorage.setItem(`chat_messages_${id}`, JSON.stringify(fetchedMessages));

                // Switch view now that messages are ready
                setChatId(id);
                setViewMode('chat');
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        } finally {
            setLoadingChatId(null);
        }
    };

    const handleDeleteChat = async (e: React.MouseEvent, id: string, title: string) => {
        e.stopPropagation(); // Prevent the chat click event from firing
        setOpenDropdownId(null);

        if (window.confirm(`Are you sure you want to delete the chat "${title}" and all its messages?`)) {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/chat/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    // Update list and clear chatId if necessary
                    setChatList(prev => prev.filter(c => c.uuid !== id));
                    localStorage.removeItem(`chat_messages_${id}`);
                    if (chatId === id) {
                        setChatId(null);
                        setMessages([]);
                        setViewMode('list');
                    }
                } else {
                    console.error("Failed to delete chat");
                }
            } catch (error) {
                console.error("Error deleting chat:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const startRenaming = (e: React.MouseEvent, id: string, currentTitle: string) => {
        e.stopPropagation();
        setOpenDropdownId(null);
        setEditTitle(currentTitle);
        setEditingChatId(id);
    };

    const submitRename = async (id: string) => {
        const originalTitle = chatList.find(c => c.uuid === id)?.title;
        if (!editTitle.trim() || editTitle.trim() === originalTitle) {
            setEditingChatId(null);
            return;
        }

        setIsLoading(true);
        setEditingChatId(null);
        try {
            const res = await fetch('/api/chat', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: id, title: editTitle.trim() })
            });

            if (res.ok) {
                const json = await res.json();
                setChatList(prev => prev.map(c => c.uuid === id ? { ...c, title: json.data.title } : c));
            } else {
                console.error("Failed to rename chat");
            }
        } catch (error) {
            console.error("Error renaming chat", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full lg:w-[380px] bg-panel-light rounded-3xl thick-border-panel p-6 flex flex-col h-full max-h-full min-h-[500px] shrink-0 relative overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b-4 border-black mb-6">
                <div className="flex items-center gap-3">
                    {viewMode === 'chat' && (
                        <button onClick={handleBackClick} className="hover:bg-black/5 p-1 rounded-full transition-colors">
                            <ArrowLeft size={28} className="text-black" />
                        </button>
                    )}
                    <Bot size={32} className="text-accent-orange" />
                    <h1 className="text-2xl font-bold font-display">
                        {viewMode === 'list' ? 'Chat History' : 'AI Assistant'}
                    </h1>
                </div>
                {viewMode === 'list' && (
                    <button
                        onClick={createNewChat}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-accent-yellow px-3 py-2 rounded-xl thick-border font-bold hover:-translate-y-1 transition-transform text-black text-sm disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                        <MessageSquarePlus size={18} />
                        New
                    </button>
                )}
            </div>

            {/* List View */}
            {viewMode === 'list' && (
                <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-3 pt-1 pr-2 custom-scrollbar">
                    {chatList.map((chat) => (
                        <div
                            key={chat.uuid}
                            onClick={() => handleChatClick(chat.uuid)}
                            className={`w-full text-left bg-white p-4 rounded-2xl thick-border hover:-translate-y-1 transition-transform group relative cursor-pointer ${openDropdownId === chat.uuid ? 'z-50' : 'z-0'}`}
                        >
                            <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0 flex-1">
                                    {editingChatId === chat.uuid ? (
                                        <input
                                            autoFocus
                                            className="w-full font-bold text-black border-b-2 border-black outline-none bg-transparent pr-4 text-base font-display mb-1"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            onBlur={() => submitRename(chat.uuid)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') submitRename(chat.uuid);
                                                if (e.key === 'Escape') setEditingChatId(null);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <h3 className="font-bold text-black truncate pr-4 text-base font-display">
                                            {chat.title}
                                        </h3>
                                    )}
                                    <p className="text-xs font-semibold text-gray-500 mt-1 font-display">
                                        {new Date(chat.last_updated).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 relative">
                                    {loadingChatId === chat.uuid && (
                                        <Loader2 className="animate-spin text-accent-orange absolute -left-6" size={20} />
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenDropdownId(openDropdownId === chat.uuid ? null : chat.uuid);
                                        }}
                                        className="p-1 rounded-lg hover:bg-black/5 text-gray-500 hover:text-black transition-colors"
                                        title="Options"
                                    >
                                        <MoreVertical size={20} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {openDropdownId === chat.uuid && (
                                        <div 
                                            className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl thick-border shadow-lg z-50 overflow-hidden"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={(e) => startRenaming(e, chat.uuid, chat.title)}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold hover:bg-black/5 text-black border-b-2 border-black"
                                            >
                                                <Edit2 size={14} />
                                                Rename
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteChat(e, chat.uuid, chat.title)}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold hover:bg-red-50 text-red-600"
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {chatList.length === 0 && !isLoading && (
                        <div className="text-center text-black font-semibold mt-10 opacity-60">
                            No chat history found.
                        </div>
                    )}
                    {isLoading && <LoadingSpinner />}
                </div>
            )}

            {/* Chat View */}
            {viewMode === 'chat' && (
                <>
                    <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-6 px-2 font-display pb-4 custom-scrollbar">
                        {isSwitchingChat ? (
                            <LoadingSpinner />
                        ) : (
                            messages.map((msg, idx) => {
                                const isAssistant = msg.role === 'assistant' || msg.role === 'system';
                                if (isAssistant) {
                                    return (
                                        <div key={msg.uuid || idx} className="flex items-end justify-start gap-3 w-full pr-12">
                                            <div className="w-10 h-10 rounded-full thick-border bg-accent-yellow overflow-hidden shrink-0 flex items-center justify-center text-black">
                                                <Bot size={24} />
                                            </div>
                                            <div className="bg-white px-5 py-3 rounded-2xl thick-border speech-bubble-left text-black whitespace-pre-wrap">
                                                <p className="font-semibold text-[15px]">{msg.content}</p>
                                            </div>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div key={msg.uuid || idx} className="flex items-end justify-end gap-3 self-end w-full pl-12 mt-4">
                                            <div className="bg-accent-mint px-5 py-3 rounded-2xl thick-border speech-bubble-right text-black relative whitespace-pre-wrap">
                                                <p className="font-semibold text-[15px]">{msg.content}</p>
                                            </div>
                                            <div className="w-10 h-10 rounded-full thick-border bg-accent-peach overflow-hidden shrink-0 flex items-center justify-center text-black">
                                                <User size={24} />
                                            </div>
                                        </div>
                                    );
                                }
                            })
                        )}

                        {isLoading && (
                            <div className="flex items-end justify-start gap-3 w-full pr-12 mt-4">
                                <div className="w-10 h-10 rounded-full thick-border bg-accent-yellow overflow-hidden shrink-0 flex items-center justify-center text-black">
                                    <Bot size={24} />
                                </div>
                                <div className="bg-white px-5 py-3 flex items-center justify-center rounded-2xl thick-border speech-bubble-left text-black relative">
                                    <LoadingSpinner size={20} containerClassName="" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="mt-6 relative font-display">
                        <input
                            className="w-full h-14 bg-white rounded-full thick-border px-6 pr-14 font-semibold text-[15px] outline-none focus:ring-0 focus:border-black text-black placeholder-gray-400 disabled:opacity-50"
                            placeholder="Type a message..."
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSendMessage();
                            }}
                            disabled={isLoading || !chatId}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isLoading || !chatId || !inputText.trim()}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
                        >
                            <Send size={24} />
                        </button>
                    </div>
                </>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: transparent; 
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: rgba(0,0,0,0.1); 
                  border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: rgba(0,0,0,0.3); 
                }
            `}</style>
        </div>
    );
}
