import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
    Users, MessageSquare, ThumbsUp, Tag, Plus, Image as ImageIcon,
    Search, Filter, Clock, ChevronUp, Bot, Sparkles, X, Loader
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper for media URLs
const getMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
    return `${backend}${path.startsWith('/') ? '' : '/'}${path}`;
};

const Community = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAskModal, setShowAskModal] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);

    // Fetch posts
    const fetchPosts = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/community/posts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPosts(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching posts:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleUpvote = async (id, type = 'post') => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/community/vote`,
                { id, type },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchPosts(); // Refresh to show new vote count
        } catch (error) {
            console.error("Vote failed:", error);
        }
    };

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center text-violet-600 dark:text-violet-400">
                                <Users size={24} />
                            </div>
                            Community & Doubts
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-2">
                            Ask questions, share knowledge, and get instant AI solutions.
                        </p>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        <button
                            onClick={() => setShowAIModal(true)}
                            className="flex-1 md:flex-none px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all flex items-center justify-center gap-2"
                        >
                            <Bot size={20} />
                            AI Doubt Solver
                            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">New</span>
                        </button>
                        <button
                            onClick={() => setShowAskModal(true)}
                            className="flex-1 md:flex-none px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={20} /> Ask Question
                        </button>
                    </div>
                </div>

                {/* Search & Stats */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <div className="md:col-span-3">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search discussions, tags, or problems..."
                                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-violet-500 text-slate-900 dark:text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    {/* Stats Card (Optional) */}
                    <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-4 text-white flex justify-between items-center shadow-lg">
                        <div>
                            <p className="text-indigo-100 text-sm font-medium">Total Discussions</p>
                            <p className="text-2xl font-bold">{posts.length}</p>
                        </div>
                        <MessageSquare className="text-white/20 w-10 h-10" />
                    </div>
                </div>

                {/* Posts Feed */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader className="w-10 h-10 text-violet-500 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredPosts.map(post => (
                            <PostCard key={post._id} post={post} onUpvote={() => handleUpvote(post._id)} />
                        ))}
                        {filteredPosts.length === 0 && (
                            <div className="text-center py-20 text-slate-500">
                                No discussions found. Be the first to start one!
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <AskQuestionModal isOpen={showAskModal} onClose={() => setShowAskModal(false)} onRefresh={fetchPosts} />
            <AIDoubtSolverModal isOpen={showAIModal} onClose={() => setShowAIModal(false)} onRefresh={fetchPosts} />
        </div>
    );
};

// Sub-component: Post Card
const PostCard = ({ post, onUpvote }) => {
    const isAI = post.isAI;
    const [showAns, setShowAns] = useState(false);

    // Fetch answers on expand (Optimized: could pass all data down, but lazy load is better for large lists)
    // For now, assume post object implies answer count or we view details page. 
    // To keep it simple for this MVP, we link to a details view or just show description.

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all ${isAI ? 'border-l-4 border-l-violet-500' : ''}`}
        >
            <div className="flex gap-4">
                {/* Vote Column */}
                <div className="flex flex-col items-center gap-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onUpvote(); }}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-violet-600 transition-colors"
                    >
                        <ChevronUp size={24} />
                    </button>
                    <span className="font-bold text-lg text-slate-700 dark:text-slate-300">{post.upvotes.length}</span>
                </div>

                {/* Content Column */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        {isAI && (
                            <span className="px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-bold rounded-full flex items-center gap-1">
                                <Sparkles size={12} /> AI Solved
                            </span>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <img
                                src={getMediaUrl(post.userId?.avatar) || `https://ui-avatars.com/api/?name=${post.userId?.name}&background=random`}
                                alt=""
                                className="w-5 h-5 rounded-full object-cover"
                            />
                            <span>{post.userId?.name || 'Anonymous'}</span>
                            <span>•</span>
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <Link to={`/community/post/${post._id}`} className="block group">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-violet-600 transition-colors">
                            {post.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                            {post.description}
                        </p>
                        {post.imageUrl && (
                            <div className="mb-4 rounded-xl overflow-hidden max-h-60 w-full md:w-1/2 bg-slate-100">
                                <img src={getMediaUrl(post.imageUrl)} alt="Doubt" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </Link>

                    <div className="flex items-center gap-3">
                        {post.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm"># {tag}</span>
                        ))}
                        <div className="flex-1"></div>
                        <Link to={`/community/post/${post._id}`} className="flex items-center gap-1 text-slate-500 hover:text-violet-600 text-sm font-medium">
                            <MessageSquare size={16} />
                            View Discussion
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Modal: Ask Question
const AskQuestionModal = ({ isOpen, onClose, onRefresh }) => {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [tags, setTags] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const tagArray = tags.split(',').map(t => t.trim());

            await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/community/posts`,
                { title, description: desc, tags: tagArray },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setLoading(false);
            onClose();
            onRefresh();
        } catch (error) {
            console.error(error);
            setLoading(false);
            alert('Failed to post');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold dark:text-white">Ask a Question</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                        <input type="text" required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" placeholder="e.g. How to use useEffect?" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                        <textarea required className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl h-32 resize-none" placeholder="Explain your doubt..." value={desc} onChange={e => setDesc(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags (comma separated)</label>
                        <input type="text" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl" placeholder="react, javascript, hooks" value={tags} onChange={e => setTags(e.target.value)} />
                    </div>
                    <button disabled={loading} className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold flex justify-center items-center gap-2">
                        {loading && <Loader className="animate-spin" size={20} />}
                        Post Question
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

// Modal: AI Doubt Solver
const AIDoubtSolverModal = ({ isOpen, onClose, onRefresh }) => {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSolve = async () => {
        if (!image) return;
        setLoading(true);
        const formData = new FormData();
        formData.append('image', image);

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/community/ai-solve`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setLoading(false);
            onClose();
            onRefresh();
        } catch (error) {
            console.error(error);
            setLoading(false);
            alert('Failed to solve doubt');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                        <Bot className="text-violet-500" /> AI Doubt Solver
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><X size={20} /></button>
                </div>

                <div className="space-y-6">
                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors relative cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                        {preview ? (
                            <div className="relative h-48 w-full">
                                <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white font-medium opacity-0 hover:opacity-100 transition-opacity rounded-lg">Change Image</div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-500">
                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                    <ImageIcon size={24} />
                                </div>
                                <p className="font-medium">Click to upload image</p>
                                <p className="text-xs">Supports JPG, PNG</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-violet-50 dark:bg-violet-900/20 p-4 rounded-xl flex items-start gap-3">
                        <Sparkles className="text-violet-600 shrink-0 mt-1" size={18} />
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                            Our AI will scan your image, extract the question, and generate a step-by-step solution automatically.
                        </div>
                    </div>

                    <button
                        onClick={handleSolve}
                        disabled={!image || loading}
                        className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader className="animate-spin" size={20} />
                                Analyzing & Solving...
                            </>
                        ) : (
                            <>
                                <Bot size={20} />
                                Solve Doubt Instantly
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Community;
