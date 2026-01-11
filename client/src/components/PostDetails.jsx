import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, MessageSquare, ThumbsUp, Send, Bot, CheckCircle,
    User, Calendar, Share, MoreHorizontal, Sparkles, Loader,
    Upload, X, Mic, StopCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API_URL from '../config/api';

const PostDetails = () => {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [replyImage, setReplyImage] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Helper for media URLs
    const getMediaUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('blob:')) return path;

        // Normalize slashes for Windows paths
        const cleanPath = path.replace(/\\/g, '/');

        // If it's a relative path from backend (e.g., /uploads/...)
        const backend = API_URL;
        return `${backend}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
    };

    const fetchDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/community/posts/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPost(res.data.post);
            setAnswers(res.data.answers);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching details:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const handlePostVote = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_URL}/api/community/vote`,
                { id: post._id, type: 'post' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPost({ ...post, upvotes: res.data });
        } catch (error) {
            console.error(error);
        }
    };

    const handleAnswerVote = async (answerId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`${API_URL}/api/community/vote`,
                { id: answerId, type: 'answer' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setAnswers(answers.map(ans =>
                ans._id === answerId ? { ...ans, upvotes: res.data } : ans
            ));
        } catch (error) {
            console.error(error);
        }
    };

    // Audio Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const timerRef = useRef(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));

                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);

            // Timer
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const deleteAudio = () => {
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingTime(0);
    };

    const handleSubmitReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim() && !replyImage && !audioBlob) return;
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('postId', id);
            formData.append('text', replyText);
            if (replyImage) {
                formData.append('image', replyImage);
            }
            if (audioBlob) {
                formData.append('audio', audioBlob, 'voice-note.webm');
            }

            await axios.post(`${API_URL}/api/community/answers`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setReplyText('');
            setReplyImage(null);
            deleteAudio(); // Clear audio
            fetchDetails(); // Reload to show new answer
            setSubmitting(false);
        } catch (error) {
            console.error(error);
            setSubmitting(false);
        }
    };

    const [generatingAI, setGeneratingAI] = useState(false);

    const handleRequestAI = async () => {
        setGeneratingAI(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/api/community/generate-answer/${id}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchDetails(); // Reload to show new answer
            setGeneratingAI(false);
        } catch (error) {
            console.error(error);
            setGeneratingAI(false);
            alert("Failed to generate AI answer");
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex justify-center items-center">
            <Loader className="animate-spin text-violet-500" />
        </div>
    );

    if (!post) return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Post not found</h2>
            <Link to="/community" className="text-violet-500 hover:underline">Back to Community</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <Link to="/community" className="inline-flex items-center gap-2 text-slate-500 hover:text-violet-600 mb-6 transition-colors">
                    <ArrowLeft size={18} /> Back to Discussions
                </Link>

                {/* Main Post */}
                <div className={`bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 mb-6 ${post.isAI ? 'border-l-4 border-l-violet-500' : ''}`}>
                    <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center gap-1">
                            <button onClick={handlePostVote} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-violet-600 transition-colors">
                                <ThumbsUp size={24} />
                            </button>
                            <span className="font-bold text-lg text-slate-700 dark:text-slate-300">{post.upvotes.length}</span>
                        </div>
                        <div className="flex-1">
                            {post.isAI && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-bold rounded-full mb-3">
                                    <Sparkles size={12} /> AI Solved
                                </span>
                            )}
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">
                                {post.title}
                            </h1>
                            <div className="flex items-center gap-3 text-sm text-slate-500 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                                <span className="flex items-center gap-2">
                                    <User size={16} /> {post.userId?.name || 'Anonymous'}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-2">
                                    <Calendar size={16} /> {new Date(post.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="prose dark:prose-invert max-w-none mb-6">
                                <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line text-lg leading-relaxed">
                                    {post.description}
                                </p>
                            </div>

                            {post.imageUrl && (
                                <div className="mb-6 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                    <img src={getMediaUrl(post.imageUrl)} alt="Attachment" className="max-w-full h-auto mx-auto" />
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                {post.tags.map(tag => (
                                    <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium"># {tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Answers Section */}
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <MessageSquare className="text-violet-500" />
                        {answers.length} Answers
                    </h3>

                    <div className="space-y-6">
                        {answers.map(answer => (
                            <motion.div
                                key={answer._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-white dark:bg-slate-800 rounded-2xl p-6 border shadow-sm ${answer.isAI ? 'border-violet-200 dark:border-violet-900 bg-violet-50/50 dark:bg-violet-900/10' : 'border-slate-100 dark:border-slate-700'}`}
                            >
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center gap-1 mt-1">
                                        <button onClick={() => handleAnswerVote(answer._id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-green-600 transition-colors">
                                            <ThumbsUp size={18} />
                                        </button>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{answer.upvotes.length}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={getMediaUrl(answer.userId?.avatar) || `https://ui-avatars.com/api/?name=${answer.userId?.name}&background=random`}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                                                />
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                        {answer.userId?.name}
                                                        {answer.isAI && <span className="bg-violet-600 text-white text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider">AI Bot</span>}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{new Date(answer.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            {answer.isAI && <Bot className="text-violet-400" />}
                                        </div>

                                        <div className="prose dark:prose-invert max-w-none">
                                            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                                                {answer.text}
                                            </p>
                                            {answer.imageUrl && (
                                                <div className="mt-3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 max-w-md">
                                                    <img src={getMediaUrl(answer.imageUrl)} alt="Answer attachment" className="w-full h-auto" />
                                                </div>
                                            )}
                                            {answer.audioUrl && (
                                                <div className="mt-3 bg-violet-50 dark:bg-violet-900/20 p-3 rounded-xl max-w-sm border border-violet-100 dark:border-violet-800">
                                                    <p className="text-xs text-violet-600 dark:text-violet-400 font-bold mb-2 flex items-center gap-1"><Mic size={12} /> Voice Answer</p>
                                                    <audio controls className="w-full h-8">
                                                        <source src={getMediaUrl(answer.audioUrl)} type="audio/webm" />
                                                        Your browser does not support the audio element.
                                                    </audio>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Add Reply Input */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-100 dark:border-slate-700 mt-8 mb-10">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your Answer</h3>

                        {/* AI Help Button - Only if no AI answer yet (or always, depending on pref) */}
                        <button
                            onClick={handleRequestAI}
                            disabled={generatingAI}
                            className="text-sm px-4 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors flex items-center gap-2"
                        >
                            {generatingAI ? <Loader size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            Generate AI Answer
                        </button>
                    </div>

                    <form onSubmit={handleSubmitReply}>
                        <textarea
                            className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 min-h-[120px] mb-4 dark:text-white transition-all"
                            placeholder="Write your solution step-by-step..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                        />

                        {/* Image Preview */}
                        {replyImage && (
                            <div className="mb-4 relative w-32 h-32 rounded-lg overflow-hidden border border-slate-200">
                                <img src={URL.createObjectURL(replyImage)} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setReplyImage(null)}
                                    className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        )}

                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                {/* Image Upload */}
                                <label className="cursor-pointer p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-violet-600 transition-colors flex items-center justify-center">
                                    <Upload size={18} />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => setReplyImage(e.target.files[0])}
                                    />
                                </label>

                                {/* Audio Recording */}
                                {!isRecording && !audioBlob && (
                                    <button
                                        type="button"
                                        onClick={startRecording}
                                        className="p-2 rounded-full bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 transition-colors flex items-center justify-center"
                                        title="Record Voice Note"
                                    >
                                        <Mic size={18} />
                                    </button>
                                )}

                                {isRecording && (
                                    <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-full border border-red-100 animate-pulse">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                                        <span className="text-xs font-bold text-red-600">{recordingTime}s</span>
                                        <button type="button" onClick={stopRecording} className="text-red-600 hover:text-red-800">
                                            <StopCircle size={18} />
                                        </button>
                                    </div>
                                )}

                                {audioBlob && (
                                    <div className="flex items-center gap-2 bg-violet-50 px-3 py-1 rounded-full border border-violet-100">
                                        <span className="text-xs font-bold text-violet-600">Voice Note Recorded</span>
                                        <button type="button" onClick={deleteAudio} className="text-slate-400 hover:text-red-500">
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button
                                disabled={submitting || (!replyText.trim() && !replyImage && !audioBlob)}
                                className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {submitting ? <Loader className="animate-spin" size={18} /> : <Send size={18} />}
                                Post Answer
                            </button>
                        </div>
                    </form>
                </div>

            </div>
            {/* Added extra padding bottom to ensure last element isn't cut off if we ever re-add sticky */}
            <div className="h-20"></div>
        </div>
    );
};

export default PostDetails;
