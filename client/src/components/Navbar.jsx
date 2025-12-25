import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
    Search,
    Bell,
    Menu,
    X,
    User,
    LogOut,
    Settings,
    FileText,
    Award,
    Activity,
    Sun,
    Moon,
    Flame, // For streak,
    Grid,
    ChevronDown,
    BookOpen,
    Code,
    Cpu,
    MessageSquare,
    Terminal,
    Check,
    CheckCheck,
    Map,
    Bot,
    Users
} from 'lucide-react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false); // Mobile menu
    const [searchTerm, setSearchTerm] = useState('');
    const [notificationCount, setNotificationCount] = useState(0);
    const [user, setUser] = useState(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showFeaturesMenu, setShowFeaturesMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [localNotifications, setLocalNotifications] = useState([]);

    // Feature Menu Hover Timer
    const featuresTimeoutRef = useRef(null);

    // Theme State
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    // Toggle Theme Logic
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser(token);
        } else {
            setUser(null);
        }
    }, [location.pathname]);

    const fetchUser = async (token) => {
        try {
            const res = await axios.get('http://localhost:5001/api/users/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(res.data);
            if (res.data.notifications && res.data.notifications.length > 0) {
                const mapped = res.data.notifications.map(n => ({
                    id: n._id || Math.random(),
                    text: n.message,
                    read: n.read,
                    time: n.date ? new Date(n.date).toLocaleDateString() : 'Just now'
                }));
                setLocalNotifications(mapped);
                setNotificationCount(mapped.filter(n => !n.read).length);
            } else {
                setLocalNotifications([
                    { id: 1, text: "Welcome to 10xCoders!", read: false, time: "Just now" },
                    { id: 2, text: "Complete your profile to get started.", read: false, time: "1 hour ago" }
                ]);
                setNotificationCount(2);
            }
        } catch (e) {
            console.error("Failed to fetch user for navbar");
        }
    };

    const handleMarkAllRead = async () => {
        setLocalNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setNotificationCount(0);
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await axios.put('http://localhost:5001/api/users/notifications/read', {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (e) {
            console.error('Failed to mark notifications as read');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setShowProfileMenu(false);
        navigate('/');
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            const term = searchTerm.toLowerCase();
            if (term.includes('dash')) navigate('/dashboard');
            else if (term.includes('prac') || term.includes('code') || term.includes('comp')) navigate('/code');
            else if (term.includes('pdf') || term.includes('tool')) navigate('/pdf-tools');
            else if (term.includes('cour') || term.includes('learn')) navigate('/courses');
            else if (term.includes('set') || term.includes('prof')) navigate('/settings');
            else if (term.includes('feat')) navigate('/home');
            else console.log("Searching for:", searchTerm);
        }
    };

    // Mock notifications if none exist or empty
    const rawNotifications = (user?.notifications && user.notifications.length > 0) ? user.notifications : [
        { _id: 1, message: "Welcome to 10xCoders!", read: false, date: new Date() },
        { _id: 2, message: "Complete your profile to get started.", read: false, date: new Date(Date.now() - 3600000) }
    ];

    const notifications = rawNotifications.map(n => ({
        id: n._id || Math.random(),
        text: n.message,
        read: n.read,
        time: n.date ? new Date(n.date).toLocaleDateString() : 'Just now'
    }));

    const loggedInLinks = [
        { name: 'Home', path: '/home' },
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Courses', path: '/courses' },
        { name: 'Practice', path: '/code' },
        // { name: 'PDF Tools', path: '/pdf-tools' }, // Moved to Features
    ];

    const featuresList = [
        { name: 'Courses', path: '/courses', icon: <BookOpen size={18} className="text-indigo-500" />, desc: 'Structured learning modules' },
        { name: 'Community', path: '/community', icon: <Users size={18} className="text-violet-500" />, desc: 'Discuss & Solve Doubts' },
        { name: 'AI Tutor', path: '/ai-tutor', icon: <Bot size={18} className="text-amber-500" />, desc: 'Personal AI Mentor ' },
        { name: 'AI Quiz', path: '/quiz', icon: <Award size={18} className="text-pink-500" />, desc: 'AI-generated assessments' },
        { name: 'Roadmaps', path: '/roadmaps', icon: <Map size={18} className="text-blue-500" />, desc: 'Personalized learning paths' },
        { name: 'Resume Maker', path: '/resume', icon: <FileText size={18} className="text-cyan-500" />, desc: 'Build professional resumes' },
        { name: 'Resume Enhancer', path: '/enhance', icon: <Activity size={18} className="text-teal-500" />, desc: 'AI-powered improvements' },
        { name: 'Career Agent', path: '/career', icon: <Award size={18} className="text-amber-500" />, desc: 'AI Career Guidance' },
        { name: 'Interview Prep', path: '/interview', icon: <MessageSquare size={18} className="text-purple-500" />, desc: 'Ace your interviews' },
        { name: 'Typing Speed', path: '/type', icon: <Code size={18} className="text-rose-500" />, desc: 'Improve typing skills' },
        { name: 'Coding Practice', path: '/code', icon: <Terminal size={18} className="text-emerald-500" />, desc: 'Real-world challenges' },
        { name: 'Project Board', path: '/todo', icon: <Grid size={18} className="text-orange-500" />, desc: 'Manage your tasks' },
        { name: 'Progress Map', path: '#progress-map', icon: <Flame size={18} className="text-orange-500" />, desc: 'Visualize Learning', isScroll: true },
        { name: 'PDF Tools', path: '/pdf-tools', icon: <FileText size={18} className="text-pink-500" />, desc: 'Merge & manage docs' },
    ];

    const publicLinks = [
        { name: 'Features', path: '#features', isScroll: true },
        { name: 'Testimonials', path: '#testimonials', isScroll: true },
        { name: 'Pricing', path: '#pricing', isScroll: true },
    ];

    const activeLinks = user ? loggedInLinks : publicLinks;

    const handleLinkClick = (path, isScroll) => {
        setIsOpen(false);
        setShowFeaturesMenu(false);
        if (isScroll) {
            if (location.pathname !== '/' && location.pathname !== '/home') {
                navigate('/home');
                setTimeout(() => {
                    const element = document.querySelector(path);
                    if (element) element.scrollIntoView({ behavior: 'smooth' });
                }, 500);
            } else {
                const element = document.querySelector(path);
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            navigate(path);
        }
    };

    return (
        <nav className={`border-b sticky top-0 w-full z-50 transition-all duration-300 shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white/95 backdrop-blur-md border-slate-200 text-slate-800'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">

                    {/* 1. Left: Logo */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center cursor-pointer group" onClick={() => navigate('/home')}>
                            <img src="/logo.png" alt="10xCoders Logo" className="h-12 w-12 object-contain mr-2 group-hover:scale-110 transition-transform rounded-full" />
                            <span className={`font-bold text-xl tracking-tight group-hover:text-indigo-600 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>10xCoders</span>
                        </div>

                        {/* Desktop Nav Links */}
                        <div className="hidden md:ml-8 md:flex md:space-x-1">
                            {activeLinks.map((link) => (
                                <button
                                    key={link.name}
                                    onClick={() => handleLinkClick(link.path, link.isScroll)}
                                    className={`px-3 py-2 text-sm font-medium transition-all duration-200 relative group rounded-md hover:bg-black/5 dark:hover:bg-white/10 ${location.pathname === link.path
                                        ? 'text-indigo-600 dark:text-indigo-400'
                                        : (theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-indigo-600')
                                        }`}
                                >
                                    {link.name}
                                </button>
                            ))}

                            {/* Features Dropdown (Only for Logged In) */}
                            {user && (
                                <div
                                    className="relative"
                                    onMouseEnter={() => {
                                        if (featuresTimeoutRef.current) clearTimeout(featuresTimeoutRef.current);
                                        setShowFeaturesMenu(true);
                                    }}
                                    onMouseLeave={() => {
                                        featuresTimeoutRef.current = setTimeout(() => setShowFeaturesMenu(false), 200);
                                    }}
                                >
                                    <button
                                        className={`px-3 py-2 text-sm font-medium transition-all duration-200 relative group rounded-md hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-1 ${theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-indigo-600'
                                            }`}
                                    >
                                        Features
                                        <ChevronDown size={14} className={`transition-transform duration-200 ${showFeaturesMenu ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {showFeaturesMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                transition={{ duration: 0.2 }}
                                                className={`absolute left-0 mt-2 w-64 rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 py-2 overflow-hidden z-50 ${theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'}`}
                                            >
                                                <div className="grid grid-cols-1 gap-1 p-2 max-h-[60vh] overflow-y-auto">
                                                    {featuresList.map((feature) => (
                                                        <Link
                                                            key={feature.name}
                                                            to={feature.path}
                                                            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-50'}`}
                                                            onClick={() => setShowFeaturesMenu(false)}
                                                        >
                                                            <div className={`mt-0.5 p-1.5 rounded-md ${theme === 'dark' ? 'bg-slate-900' : 'bg-white shadow-sm border border-slate-100'}`}>
                                                                {feature.icon}
                                                            </div>
                                                            <div>
                                                                <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>{feature.name}</p>
                                                                <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{feature.desc}</p>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. Center: Global Search (Only if logged In) */}
                    {user && (
                        <div className="hidden md:flex flex-1 items-center justify-center px-8">
                            <div className="w-full max-w-md relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className={`h-4 w-4 transition-colors ${theme === 'dark' ? 'text-slate-500 group-hover:text-indigo-400' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                                </div>
                                <input
                                    type="text"
                                    className={`block w-full pl-10 pr-3 py-2 border rounded-full leading-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent sm:text-sm transition-all shadow-sm group-hover:shadow-md ${theme === 'dark'
                                        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-900'
                                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                                        }`}
                                    placeholder="Search features (e.g. 'code', 'resume')..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleSearch}
                                />
                            </div>
                        </div>
                    )}

                    {/* 3. Right: Icons & Profile */}
                    <div className="flex items-center space-x-3 sm:space-x-4">
                        {/* Progress Indicator (Authenticated) */}
                        {user && (
                            <>
                                <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors cursor-help ${theme === 'dark' ? 'bg-orange-900/20 border-orange-900/40' : 'bg-orange-50 border-orange-100'}`} title="Weekly Streak Goal">
                                    <Flame className="w-4 h-4 text-orange-500" fill="currentColor" />
                                    <div className="flex flex-col w-24">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="text-[10px] uppercase font-bold text-orange-600 leading-none">
                                                {user.streak && user.streak.current ? user.streak.current : 0} Day Streak
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-orange-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-1000"
                                                style={{ width: `${Math.min(((user?.streak?.current || 0) % 7) * 100 / 7, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Notification Bell */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        className={`relative p-2 transition-all rounded-full hover:scale-110 active:scale-95 ${theme === 'dark' ? 'text-slate-300 hover:text-indigo-400 hover:bg-slate-800' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}
                                    >
                                        <Bell className="w-5 h-5" />
                                        {(notificationCount > 0 || notifications.some(n => !n.read)) && (
                                            <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-pulse"></span>
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {showNotifications && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                className={`absolute right-0 mt-2 w-80 rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 py-2 z-50 overflow-hidden ${theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'}`}
                                            >
                                                <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                                    <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                                                    <button onClick={handleMarkAllRead} className="text-xs text-indigo-600 hover:underline">Mark all read</button>
                                                </div>
                                                <div className="max-h-64 overflow-y-auto">
                                                    {localNotifications.length > 0 ? (
                                                        localNotifications.map((notif) => (
                                                            <div key={notif.id} className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer border-b border-gray-50 last:border-0 flex items-start gap-3 ${!notif.read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                                                                <div className="flex-1">
                                                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`}>{notif.text}</p>
                                                                    <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                                                                </div>
                                                                {notif.read && <CheckCheck size={16} className="text-green-500 mt-1" />}
                                                                {!notif.read && <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2"></div>}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="px-4 py-6 text-center text-gray-500 text-sm">No new notifications</div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </>
                        )}

                        {/* Theme Toggle */}
                        <button
                            className={`p-2 transition-all rounded-full hover:rotate-12 ${theme === 'dark' ? 'text-slate-300 hover:text-yellow-400 hover:bg-slate-800' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'}`}
                            onClick={toggleTheme}
                        >
                            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </button>

                        {/* Profile / Auth Buttons */}
                        {user ? (
                            <div className="relative ml-2">
                                <button
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="flex items-center gap-2 focus:outline-none ring-2 ring-transparent hover:ring-indigo-100 rounded-full transition-all"
                                >
                                    <img
                                        className="h-9 w-9 rounded-full border border-indigo-100 object-cover shadow-sm hover:shadow-md transition-shadow"
                                        src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff`}
                                        alt=""
                                    />
                                </button>

                                <AnimatePresence>
                                    {showProfileMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className={`absolute right-0 mt-2 w-56 rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 py-1 focus:outline-none z-50 ${theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}
                                        >
                                            <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                                                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{user.name}</p>
                                                <p className={`text-xs truncate ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{user.email}</p>
                                            </div>

                                            <Link to="/dashboard" className={`block px-4 py-2 text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`} onClick={() => setShowProfileMenu(false)}>
                                                <User size={16} /> My Dashboard
                                            </Link>
                                            <Link to="/settings" className={`block px-4 py-2 text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`} onClick={() => setShowProfileMenu(false)}>
                                                <Settings size={16} /> Settings
                                            </Link>

                                            <div className={`border-t mt-1 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
                                                <button
                                                    onClick={handleLogout}
                                                    className={`block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 ${theme === 'dark' ? 'hover:bg-red-900/20' : ''}`}
                                                >
                                                    <LogOut size={16} /> Logout
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link to="/login" className={`text-sm font-medium transition-colors ${theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-indigo-600'}`}>
                                    Login
                                </Link>
                                <Link to="/login" className="text-sm font-medium px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 hover:shadow-lg transition-all transform hover:scale-105">
                                    Get Started
                                </Link>
                            </div>
                        )}

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center">
                            <button onClick={() => setIsOpen(!isOpen)} className={`${theme === 'dark' ? 'text-slate-300 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                                {isOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className={`md:hidden border-t overflow-hidden ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}
                    >
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                            {/* Mobile Search */}
                            {user && (
                                <div className="px-3 mb-3">
                                    <input
                                        type="text"
                                        className={`block w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={handleSearch}
                                    />
                                </div>
                            )}

                            {activeLinks.map((link) => (
                                <button
                                    key={link.name}
                                    onClick={() => handleLinkClick(link.path, link.isScroll)}
                                    className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${theme === 'dark' ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-50'}`}
                                >
                                    {link.name}
                                </button>
                            ))}

                            {/* Mobile Features List */}
                            {user && (
                                <div className="px-3 py-2">
                                    <p className={`text-xs font-semibold uppercase mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Features</p>
                                    {featuresList.map((feature) => (
                                        <Link
                                            key={feature.name}
                                            to={feature.path}
                                            onClick={() => setIsOpen(false)}
                                            className={`block py-2 text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}
                                        >
                                            {feature.name}
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {!user && (
                                <Link
                                    to="/login"
                                    className="block px-3 py-2 rounded-md text-base font-medium text-indigo-600 hover:bg-indigo-50"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav >
    );
};

export default Navbar;
