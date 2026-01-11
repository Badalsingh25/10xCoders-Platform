import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, Code, FileText, CheckCircle, HelpCircle, Plus, MessageSquare, Trash2, Menu, X, Clock } from 'lucide-react';
import API_URL from '../config/api';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import aiBotImg from '../assets/ai-bot.png'; // Ensure this matches existing import if file exists, or use URL
// Note: Step 86 used import aiBotImg but then used "/chatbot.jpg" in img src. I will stick to "/chatbot.jpg" for consistency.

const AIMessage = ({ content }) => {
    return (
        <div className="ai-message">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

const AITutor = () => {
    const [chats, setChats] = useState([]);
    const [activeChatId, setActiveChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [context, setContext] = useState('GENERAL');
    const [loading, setLoading] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false); // Mobile sidebar toggle
    const messagesEndRef = useRef(null);

    // Initial Load & History Fetch
    useEffect(() => {
        fetchHistory();
    }, []);

    // Scroll to bottom on message change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/ai/history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChats(res.data);
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    const loadChat = async (chatId) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/ai/chat/${chatId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessages(res.data.messages.map(msg => ({
                role: msg.role === 'model' ? 'ai' : 'user', // Map backend 'model' to frontend 'ai'
                text: msg.text
            })));
            setActiveChatId(chatId);
            setContext(res.data.context || 'GENERAL');
            setShowSidebar(false); // Close mobile sidebar
        } catch (error) {
            console.error("Failed to load chat", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNewChat = () => {
        setActiveChatId(null);
        setMessages([{ role: 'ai', text: "Hi! I'm your AI Tutor. I can help with Course Doubts, Code Explanations, Interview Prep, or Resume Enhancements. What are we working on today?" }]);
        setContext('GENERAL');
        setShowSidebar(false);
    };

    const handleDeleteChat = async (e, chatId) => {
        e.stopPropagation(); // Prevent loading the chat when clicking delete
        if (!confirm("Are you sure you want to delete this conversation?")) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/api/ai/chat/${chatId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Remove from list
            setChats(prev => prev.filter(c => c._id !== chatId));

            // If active chat deleted, reset
            if (activeChatId === chatId) {
                handleNewChat();
            }
        } catch (error) {
            console.error("Failed to delete chat", error);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userText = input;
        const userMessage = { role: 'user', text: userText };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        // Optimistic UI update for sidebar title if it's the first message of a new chat (Optional, complex to sync usually)

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/ai/ask`, {
                context,
                question: userText,
                chatId: activeChatId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.answer) {
                const aiMessage = { role: 'ai', text: res.data.answer };
                setMessages(prev => [...prev, aiMessage]);

                // If it was a new chat, the backend created it and returned a chatId
                if (!activeChatId && res.data.chatId) {
                    setActiveChatId(res.data.chatId);
                    // Refresh history to show the new chat in sidebar
                    fetchHistory();
                }
            }
        } catch (error) {
            console.error("AI Error", error);
            setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I encountered an error connecting to the brain. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const contextOptions = [
        { id: 'GENERAL', label: 'General Help', icon: <HelpCircle size={18} /> },
        { id: 'COURSE_DOUBT', label: 'Course Doubts', icon: <CheckCircle size={18} /> },
        { id: 'CODE_EXPLANATION', label: 'Code Explain', icon: <Code size={18} /> },
        { id: 'INTERVIEW_PREP', label: 'Interview', icon: <User size={18} /> },
        { id: 'RESUME_HELP', label: 'Resume', icon: <FileText size={18} /> },
    ];

    return (
        <div className="h-[calc(100vh-5rem)] bg-slate-50 dark:bg-slate-900 flex py-4 px-2 md:px-6 gap-6 overflow-hidden">

            {/* Sidebar (Desktop + Mobile) */}
            <div className={`
                fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-800 shadow-xl transform transition-transform duration-300 z-50 rounded-r-2xl border-r border-slate-200 dark:border-slate-700
                md:relative md:transform-none md:shadow-none md:border-none md:bg-transparent md:translate-x-0 md:rounded-none md:flex flex-col
                ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-4 flex flex-col h-full bg-white dark:bg-slate-800 md:rounded-2xl md:shadow-sm md:border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <Clock size={20} className="text-indigo-500" /> History
                        </h2>
                        <button onClick={() => setShowSidebar(false)} className="md:hidden text-slate-500">
                            <X size={24} />
                        </button>
                    </div>

                    <button
                        onClick={handleNewChat}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-medium transition-all shadow-md hover:shadow-lg mb-4"
                    >
                        <Plus size={20} />
                        New Chat
                    </button>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {chats.length === 0 ? (
                            <div className="text-center text-slate-400 py-8 text-sm">
                                <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                                No history yet
                            </div>
                        ) : (
                            chats.map(chat => (
                                <div
                                    key={chat._id}
                                    onClick={() => loadChat(chat._id)}
                                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${activeChatId === chat._id
                                        ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-700'
                                        : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <MessageSquare size={18} className={activeChatId === chat._id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"} />
                                        <div className="truncate">
                                            <p className={`text-sm font-medium truncate ${activeChatId === chat._id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {chat.title || "New Conversation"}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {new Date(chat.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteChat(e, chat._id)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Backdrop for Mobile Sidebar */}
            {showSidebar && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setShowSidebar(false)}
                />
            )}

            {/* Main Chat Area */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden relative">

                {/* Header */}
                <div className="bg-indigo-600 p-4 flex items-center justify-between shadow-md z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowSidebar(true)} className="md:hidden text-white/80 hover:text-white">
                            <Menu size={24} />
                        </button>
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/30 hidden sm:flex">
                            <img src="/chatbot.jpg" alt="AI" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white leading-tight">AI Personal Tutor</h1>
                            <p className="text-indigo-100 text-xs flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                Online • Gemini 2.0 Flash
                            </p>
                        </div>
                    </div>
                    {/* Add options like 'Clear Chat' here if needed */}
                </div>

                {/* Context Selector */}
                <div className="bg-indigo-50 dark:bg-slate-700/30 p-2 flex gap-2 overflow-x-auto border-b border-indigo-100 dark:border-slate-700 shrink-0 scrollbar-hide">
                    {contextOptions.map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setContext(opt.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${context === opt.id
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600'
                                }`}
                        >
                            {opt.icon}
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50 dark:bg-slate-900/50">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                            <div className="w-24 h-24 bg-indigo-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                <Bot size={48} className="text-indigo-500 opacity-50" />
                            </div>
                            <p>Select a topic and start asking!</p>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`chat-container ${msg.role === 'user' ? 'flex-row-reverse' : ''} group`}>
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden mx-2 shadow-sm ${msg.role === 'ai' ? 'bg-indigo-100 border border-indigo-200' : 'bg-slate-200 text-slate-600'
                                }`}>
                                {msg.role === 'ai' ? <img src="/chatbot.jpg" alt="AI" className="w-full h-full object-cover" /> : <User size={18} />}
                            </div>

                            {msg.role === 'ai' ? (
                                <div className="ai-bubble rounded-tl-none shadow-sm max-w-[85%]">
                                    <AIMessage content={msg.text} />
                                </div>
                            ) : (
                                <div className="bg-indigo-600 text-white p-3 md:p-4 rounded-2xl rounded-tr-none max-w-[85%] text-sm leading-relaxed shadow-md">
                                    <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                                </div>
                            )}
                        </div>
                    ))}
                    {loading && (
                        <div className="flex items-start gap-3 animate-pulse">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center overflow-hidden mx-2">
                                <Bot size={20} className="text-indigo-600" />
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-sm">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shrink-0">
                    <div className="relative max-w-4xl mx-auto">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Ask about ${contextOptions.find(c => c.id === context)?.label || 'anything'}... (Shift+Enter for new line)`}
                            className="w-full pl-4 pr-12 py-3.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none max-h-32 min-h-[3.5rem] dark:text-white shadow-sm transition-all"
                            rows={1}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className="absolute right-2 bottom-2.5 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md transform hover:scale-105 active:scale-95"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-slate-400 mt-2">
                        AI can make mistakes. Consider checking important information.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AITutor;
