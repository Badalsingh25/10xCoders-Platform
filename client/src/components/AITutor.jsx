import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, Code, FileText, CheckCircle, HelpCircle, AlertCircle, Loader } from 'lucide-react';
import aiBotImg from '../assets/ai-bot.png';

const AITutor = () => {
    const [messages, setMessages] = useState([
        { role: 'ai', text: "Hi! I'm your AI Tutor. I can help with Course Doubts, Code Explanations, Interview Prep, or Resume Enhancements. What are we working on today?" }
    ]);
    const [input, setInput] = useState('');
    const [context, setContext] = useState('GENERAL');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5001/api/ai/ask', {
                context,
                question: input,
                // Code could be parsed from input or added as a separate field in a more complex UI
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.answer) {
                setMessages(prev => [...prev, { role: 'ai', text: res.data.answer }]);
            }
        } catch (error) {
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

    // Helper to render markdown-like text (simple version)
    const renderText = (text) => {
        const sections = text.split('\n');
        return sections.map((sec, i) => (
            <div key={i} className="min-h-[1.5rem]">
                {sec.startsWith('```') ? <code className="block bg-black/10 dark:bg-black/30 p-2 rounded my-2 font-mono text-sm whitespace-pre-wrap">{sec.replace(/```/g, '')}</code> : sec}
            </div>
        ));
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900 flex flex-col items-center py-6 px-4">
            <div className="w-full max-w-4xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[80vh] border border-slate-200 dark:border-slate-700">
                {/* Header */}
                <div className="bg-indigo-600 p-4 flex items-center gap-4 shadow-md z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/30">
                        <img src="/chatbot.jpg" alt="AI Bot" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">AI Personal Tutor</h1>
                        <p className="text-indigo-100 text-xs">Powered by Gemini 2.0 Flash</p>
                    </div>
                </div>

                {/* Context Selector */}
                <div className="bg-indigo-50 dark:bg-slate-700/50 p-2 flex gap-2 overflow-x-auto border-b border-indigo-100 dark:border-slate-700 scrollbar-hide">
                    {contextOptions.map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => setContext(opt.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${context === opt.id
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            {opt.icon}
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${msg.role === 'ai' ? 'bg-indigo-100 border border-indigo-200' : 'bg-slate-200 text-slate-600'
                                }`}>
                                {msg.role === 'ai' ? <img src="/chatbot.jpg" alt="AI" className="w-full h-full object-cover" /> : <User size={18} />}
                            </div>
                            <div className={`p-4 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'
                                }`}>
                                <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center overflow-hidden">
                                <Bot size={20} className="text-indigo-600" />
                            </div>
                            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-tl-none flex items-center gap-2">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                    <div className="relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={`Ask about ${contextOptions.find(c => c.id === context)?.label || 'anything'}... (Shift+Enter for new line)`}
                            className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none max-h-32 min-h-[3rem] dark:text-white"
                            rows={1}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className="absolute right-2 bottom-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AITutor;
