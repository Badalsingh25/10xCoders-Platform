import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import ProgressMap from './ProgressMap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    User,
    BookOpen,
    FileText,
    Activity,
    Award,
    Clock,
    Settings,
    LogOut,
    ChevronRight,
    TrendingUp,
    Plus,
    Upload,
    X,
    Folder,
    MoreVertical,
    Trash2
} from 'lucide-react';

const Dashboard = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [unansweredPosts, setUnansweredPosts] = useState([]);
    const [showResumeModal, setShowResumeModal] = useState(false);
    const [showCertificateModal, setShowCertificateModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const initDashboard = async () => {
            let token = localStorage.getItem('token');
            const urlToken = searchParams.get('token');

            if (urlToken) {
                token = urlToken;
                localStorage.setItem('token', token);
                window.history.replaceState({}, document.title, "/dashboard");
            }

            if (!token) {
                navigate('/');
                return;
            }

            fetchUserData(token);
        };

        const interval = setInterval(() => {
            const token = localStorage.getItem('token');
            if (token) fetchUserData(token);
        }, 30000); // Poll every 30s to update activity/hours

        initDashboard();
        return () => clearInterval(interval);
    }, [navigate, searchParams]);

    const fetchUserData = async (token) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/users/me`, config);
            setUserData(response.data);

            const postsRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/community/unanswered`, config);
            setUnansweredPosts(postsRes.data);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching user data:', error);
            if (loading) { // Only redirect on first load fail
                localStorage.removeItem('token');
                navigate('/');
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUploadResume = async () => {
        if (!selectedFile) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('title', selectedFile.name);

            const config = {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data'
                }
            };
            await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/users/resume`, formData, config);

            await fetchUserData(localStorage.getItem('token'));
            setShowResumeModal(false);
            setSelectedFile(null);
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setUploading(false);
        }
    };

    const handleUploadCertificate = async () => {
        if (!selectedFile) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('title', selectedFile.name);

            const config = {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'multipart/form-data'
                }
            };
            await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/users/certificate`, formData, config);

            await fetchUserData(localStorage.getItem('token'));
            setShowCertificateModal(false);
            setSelectedFile(null);
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setUploading(false);
        }
    };

    const toggleMenu = (e, id) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === id ? null : id);
    };

    const handleDelete = async (e, type, id) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/users/${type}/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchUserData(token);
            setOpenMenuId(null);
        } catch (error) {
            console.error("Delete failed", error);
        }
    };

    // Format seconds into HH:MM:SS (assuming codingHours is stored as hours float, convert first)
    // Actually user req says "hr.,min,second". Store as hours (float).
    const formatCodingHours = (hours) => {
        if (!hours) return "0h 0m 0s";
        const totalSeconds = hours * 3600;
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = Math.floor(totalSeconds % 60);
        return `${h}h ${m}m ${s}s`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!userData) return null;

    const streakCurrent = userData.streak && userData.streak.current ? userData.streak.current : 0;
    const coursesInProgress = userData.courses ? userData.courses.filter(c => !c.completed) : [];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex pt-16 relative">
            {/* Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 fixed top-16 bottom-0 z-30">
                <div className="p-6">
                    <button onClick={() => navigate('/code')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md mb-2">
                        <Plus size={18} />
                        <span className="font-medium">New Practice</span>
                    </button>
                    <p className="text-xs text-center text-slate-400 mt-2">Start a new coding session</p>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    <NavItem icon={<User size={20} />} label="Overview" active onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
                    <NavItem icon={<BookOpen size={20} />} label="My Courses" onClick={() => navigate('/courses')} />
                    <NavItem icon={<FileText size={20} />} label="Resumes" onClick={() => setShowResumeModal(true)} />
                    <NavItem icon={<Award size={20} />} label="Certificates" onClick={() => setShowCertificateModal(true)} />
                    <NavItem icon={<TrendingUp size={20} />} label="Progress" onClick={() => document.getElementById('progress-section')?.scrollIntoView({ behavior: 'smooth' })} />
                    <NavItem icon={<Activity size={20} />} label="Activity" onClick={() => document.getElementById('activity-section')?.scrollIntoView({ behavior: 'smooth' })} />
                    <div className="pt-4 pb-2">
                        <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Settings</p>
                    </div>
                    <NavItem icon={<Settings size={20} />} label="Settings" onClick={() => navigate('/settings')} />
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-6 md:p-10 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* Header */}
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                                Welcome back, {userData.name.split(' ')[0]}! 👋
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Here's what's happening with your learning journey.</p>
                        </div>
                        <div className="hidden md:flex items-center gap-3 bg-white dark:bg-slate-800 p-2 pr-4 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
                            <img
                                src={(userData.avatar && userData.avatar.startsWith('http'))
                                    ? userData.avatar
                                    : (userData.avatar ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}${userData.avatar}` : `https://ui-avatars.com/api/?name=${userData.name}&background=6366f1&color=fff`)}
                                alt="Profile"
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="text-sm">
                                <p className="font-medium text-slate-900 dark:text-white">{userData.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Learner</p>
                            </div>
                        </div>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Courses in Progress"
                            value={coursesInProgress.length}
                            icon={<BookOpen className="text-white" size={24} />}
                            color="bg-indigo-500"
                        />
                        <StatCard
                            title="Saved Resumes"
                            value={userData.savedResumes?.length || 0}
                            icon={<FileText className="text-white" size={24} />}
                            color="bg-purple-500"
                        />
                        <StatCard
                            title="Current Streak"
                            value={`${userData.streak?.current || 0} Days`}
                            icon={<TrendingUp className="text-white" size={24} />}
                            color="bg-orange-500"
                        />
                        <StatCard
                            title="Coding Hours"
                            value={formatCodingHours(userData.codingHours)}
                            icon={<Clock className="text-white" size={24} />}
                            color="bg-emerald-500"
                            isTime={true}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Column */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Continue Learning & Questions Waiting */}
                            <section className="grid md:grid-cols-2 gap-6">
                                {/* Continue Learning Widget */}
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Clock className="text-indigo-500" size={20} /> Continue Learning
                                    </h2>
                                    {coursesInProgress.length > 0 ? (
                                        <div className="space-y-4">
                                            {coursesInProgress.slice(0, 2).map((course, idx) => (
                                                <div key={idx} onClick={() => navigate('/courses')} className="cursor-pointer group relative">
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="font-medium text-slate-700 dark:text-slate-300">{course.title}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-indigo-600">{course.progress}%</span>
                                                            <button onClick={(e) => toggleMenu(e, course._id)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full transition">
                                                                <MoreVertical size={14} className="text-slate-400" />
                                                            </button>
                                                            {openMenuId === course._id && (
                                                                <div className="absolute right-0 top-6 bg-white dark:bg-slate-800 shadow-lg rounded-lg py-1 z-50 border border-slate-100 dark:border-slate-700">
                                                                    <button onClick={(e) => handleDelete(e, 'course', course._id)} className="flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left">
                                                                        <Trash2 size={12} /> Delete
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${course.progress}%` }}></div>
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={() => navigate('/courses')} className="w-full mt-2 py-2 text-sm text-indigo-600 font-medium bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition">
                                                Resume Learning
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <p className="text-sm text-slate-500 mb-4">No active courses.</p>
                                            <button onClick={() => navigate('/courses')} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Start a Course</button>
                                        </div>
                                    )}
                                </div>

                                {/* Questions Waiting for Answers */}
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Activity className="text-orange-500" size={20} /> Needs Your Help
                                    </h2>
                                    <div className="space-y-3">
                                        {unansweredPosts.length > 0 ? (
                                            unansweredPosts.map(post => (
                                                <div key={post._id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition" onClick={() => navigate(`/community/post/${post._id}`)}>
                                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{post.title}</p>
                                                    <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                                                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                                        <span className="text-orange-600 font-bold">Unanswered</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-4 text-slate-500 text-sm">No unanswered questions!</div>
                                        )}
                                    </div>
                                    <button onClick={() => navigate('/community')} className="w-full mt-4 py-2 text-sm text-slate-600 dark:text-slate-400 font-medium hover:text-indigo-600 transition">
                                        View All Questions
                                    </button>
                                </div>
                            </section>

                            {/* Recommended Next Step */}
                            <section className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                                <div className="relative z-10 flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 opacity-90">
                                            <TrendingUp size={18} />
                                            <span className="text-sm font-bold uppercase tracking-wider">Recommended Next Step</span>
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2">
                                            {userData.dashboardStats?.recommendation?.title || 'Start a New Course'}
                                        </h3>
                                        <p className="text-indigo-100 mb-6 max-w-lg">
                                            {userData.dashboardStats?.recommendation?.subtitle || 'Explore our catalog to begin your journey.'}
                                        </p>
                                        <button
                                            onClick={() => navigate(userData.dashboardStats?.recommendation?.link || '/courses')}
                                            className="px-6 py-2 bg-white text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition shadow-md"
                                        >
                                            Continue Now
                                        </button>
                                    </div>
                                    <div className="hidden md:block">
                                        <Award size={100} className="text-white/20" />
                                    </div>
                                </div>
                            </section>

                            {/* Progress Visualizations */}
                            {userData.dashboardStats && (
                                <section id="progress-section">
                                    <div className="mt-12 mb-12">
                                        <ProgressMap stats={userData.dashboardStats} isDashboard={true} />
                                    </div>
                                </section>
                            )}

                            {/* Recent Activity */}
                            <section id="activity-section">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Recent Activity</h2>
                                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                                    {userData.activityLog && userData.activityLog.length > 0 ? (
                                        <div className="divide-y divide-slate-100">
                                            {userData.activityLog.slice().reverse().slice(0, 10).map((log, index) => (
                                                <div key={index} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0">
                                                        <Activity size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{log.details || log.action}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-slate-500 dark:text-slate-400">No recent activity</div>
                                    )}
                                </div>
                            </section>

                        </div>

                        {/* Right Column */}
                        <div className="space-y-8">
                            {/* Saved Resumes Widget */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Saved Resumes</h2>
                                    <button onClick={() => setShowResumeModal(true)} className="text-sm text-indigo-600 font-medium hover:underline">+ New</button>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-3">
                                    {userData.savedResumes && userData.savedResumes.length > 0 ? (
                                        userData.savedResumes.slice(0, 5).map((resume, idx) => (
                                            <div key={idx} onClick={() => window.open(resume.data?.fileUrl ? resume.data.fileUrl.replace('http://localhost:5001', import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001') : '#', '_blank')} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-600 transition cursor-pointer group relative">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <FileText size={18} className="text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 flex-shrink-0" />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-900 dark:group-hover:text-indigo-400 truncate">{resume.title || `Resume ${idx + 1}`}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={(e) => toggleMenu(e, resume._id)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-full transition opacity-0 group-hover:opacity-100">
                                                        <MoreVertical size={16} className="text-slate-400 dark:text-slate-300" />
                                                    </button>
                                                    {openMenuId === resume._id && (
                                                        <div className="absolute right-2 top-8 bg-white dark:bg-slate-800 shadow-lg rounded-lg py-1 z-50 border border-slate-100 dark:border-slate-700 w-24">
                                                            <button onClick={(e) => handleDelete(e, 'resume', resume._id)} className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left">
                                                                <Trash2 size={12} /> Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-sm text-slate-500 mb-3">No saved resumes</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Certificates Widget */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Certificates</h2>
                                    <button onClick={() => setShowCertificateModal(true)} className="text-sm text-indigo-600 font-medium hover:underline">+ Upload</button>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 space-y-3">
                                    {userData.certificates && userData.certificates.length > 0 ? (
                                        userData.certificates.slice(0, 3).map((cert, idx) => (
                                            <div key={idx} onClick={() => window.open(cert.fileUrl ? cert.fileUrl.replace('http://localhost:5001', import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001') : '#', '_blank')} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-600 transition cursor-pointer group relative">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <Award size={18} className="text-emerald-500 flex-shrink-0" />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-emerald-900 dark:group-hover:text-emerald-400 truncate">{cert.title || `Certificate ${idx + 1}`}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={(e) => toggleMenu(e, cert._id)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-500 rounded-full transition opacity-0 group-hover:opacity-100">
                                                        <MoreVertical size={16} className="text-slate-400 dark:text-slate-300" />
                                                    </button>
                                                    {openMenuId === cert._id && (
                                                        <div className="absolute right-2 top-8 bg-white dark:bg-slate-800 shadow-lg rounded-lg py-1 z-50 border border-slate-100 dark:border-slate-700 w-24">
                                                            <button onClick={(e) => handleDelete(e, 'certificate', cert._id)} className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left">
                                                                <Trash2 size={12} /> Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-sm text-slate-500 mb-3">No certificates uploaded</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                    </div>


                </div>
            </main>

            {/* Resume Modal */}
            {showResumeModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Resume Options</h3>
                            <button onClick={() => { setShowResumeModal(false); setSelectedFile(null); }} className="text-slate-400 hover:text-slate-600 dark:text-slate-300"><X size={24} /></button>
                        </div>

                        <div className="space-y-4">
                            <button onClick={() => navigate('/resume')} className="w-full group p-4 rounded-xl border-2 border-slate-100 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all flex items-center gap-4 text-left">
                                <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 group-hover:scale-110 transition-transform">
                                    <Plus size={24} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-white">Create New Resume</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Build a professional resume from scratch</p>
                                </div>
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-slate-500">Or</span>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-center cursor-pointer relative">
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pdf,.doc,.docx,image/*" />
                                <div className="flex flex-col items-center gap-2">
                                    <Upload size={32} className="text-slate-400" />
                                    <p className="font-medium text-slate-700 dark:text-slate-300">{selectedFile ? selectedFile.name : "Upload from Computer"}</p>
                                    <p className="text-xs text-slate-400">PDF, DOC, DOCX, Images</p>
                                </div>
                            </div>

                            <button
                                disabled={!selectedFile || uploading}
                                onClick={handleUploadResume}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? 'Uploading...' : 'Save Uploaded Resume'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Certificate Modal */}
            {showCertificateModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Upload Certificate</h3>
                            <button onClick={() => { setShowCertificateModal(false); setSelectedFile(null); }} className="text-slate-400 hover:text-slate-600 dark:text-slate-300"><X size={24} /></button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-8 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors text-center cursor-pointer relative">
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pdf,.doc,.docx,image/*" />
                                <div className="flex flex-col items-center gap-2">
                                    <Upload size={32} className="text-slate-400" />
                                    <p className="font-medium text-slate-700 dark:text-slate-300">{selectedFile ? selectedFile.name : "Select Certificate File"}</p>
                                    <p className="text-xs text-slate-400">Upload from folder 📁</p>
                                </div>
                            </div>

                            <button
                                disabled={!selectedFile || uploading}
                                onClick={handleUploadCertificate}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? 'Uploading...' : 'Save Certificate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const NavItem = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active
            ? 'bg-indigo-50 text-indigo-600 font-medium'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 hover:text-slate-900'
            }`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const StatCard = ({ title, value, icon, color, subtext, isTime }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-start justify-between hover:shadow-md transition-shadow">
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">{title}</p>
            <h3 className={`font-bold text-slate-900 dark:text-white ${isTime ? 'text-xl' : 'text-2xl'}`}>{value}</h3>
            {subtext && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1"><TrendingUp size={12} /> {subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color} shadow-lg shadow-indigo-200 dark:shadow-none`}>
            {icon}
        </div>
    </div>
);

const CourseCard = ({ course }) => {
    const navigate = useNavigate();
    return (
        <div
            onClick={() => navigate('/courses')}
            className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 hover:border-indigo-100 dark:hover:border-indigo-900 transition-colors cursor-pointer group"
        >
            <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0">
                <BookOpen className="text-indigo-600 dark:text-indigo-400" size={20} />
            </div>
            <div className="flex-1">
                <div className="flex justify-between mb-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{course.title}</h3>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{course.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                    <div
                        className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${course.progress}%` }}
                    />
                </div>
            </div>
            <button className="p-2 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                <ChevronRight size={20} />
            </button>
        </div>
    );
};

export default Dashboard;
