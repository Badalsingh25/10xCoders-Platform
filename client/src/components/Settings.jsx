import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Camera, Save, Lock, User, Mail, Eye, EyeOff } from 'lucide-react';

const Settings = () => {
    const [user, setUser] = useState({
        name: '',
        email: '',
        avatar: '',
        password: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/users/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(prev => ({ ...prev, ...res.data, password: '' }));
                setLoading(false);
            } catch (e) {
                console.error(e);
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            // Create a preview URL
            setUser(prev => ({ ...prev, avatar: URL.createObjectURL(file) }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        const token = localStorage.getItem('token');

        try {
            const formData = new FormData();
            formData.append('name', user.name);
            formData.append('email', user.email);
            if (user.phone) formData.append('phone', user.phone);
            if (user.address) formData.append('address', user.address);
            if (user.github) formData.append('github', user.github);
            if (user.linkedin) formData.append('linkedin', user.linkedin);
            if (user.twitter) formData.append('twitter', user.twitter);
            if (user.password) formData.append('password', user.password);

            // Append file if selected, otherwise append current avatar URL string
            if (selectedFile) {
                formData.append('avatar', selectedFile);
            } else {
                formData.append('avatar', user.avatar);
            }

            const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/users/profile`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setUser(prev => ({ ...prev, ...res.data, password: '' }));
            setMessage('Profile updated successfully!');
            setSelectedFile(null); // Reset file selection

            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
            }
            setSaving(false);
        } catch (e) {
            console.error(e);
            setMessage('Failed to update profile.');
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600"></div></div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white dark:bg-slate-900 shadow rounded-2xl overflow-hidden transition-colors">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account Settings</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your profile information and security.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {message && (
                            <div className={`p-4 rounded-lg text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {message}
                            </div>
                        )}

                        {/* Avatar Section */}
                        <div className="flex flex-col items-center sm:flex-row gap-6">
                            <div className="relative group">
                                <img
                                    src={selectedFile ? URL.createObjectURL(selectedFile) : (user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}${user.avatar}`) : `https://ui-avatars.com/api/?name=${user.name}`)}
                                    alt="Profile"
                                    className="h-24 w-24 rounded-full object-cover border-4 border-slate-50 dark:border-slate-800 shadow-sm"
                                />
                                <div
                                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    <Camera className="text-white w-6 h-6" />
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>
                            <div className="flex-1 space-y-2 w-full">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Profile Picture</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current.click()}
                                        className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
                                    >
                                        Upload New
                                    </button>
                                    <input
                                        type="text"
                                        name="avatar"
                                        value={selectedFile ? 'Image selected' : (user.avatar || '')}
                                        readOnly={!!selectedFile}
                                        onChange={handleChange}
                                        placeholder="Or paste URL here..."
                                        className="block w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Upload a file or paste a URL.</p>
                            </div>
                        </div>

                        <hr className="border-slate-100 dark:border-slate-800" />

                        {/* Personal Info */}
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="name"
                                        value={user.name}
                                        onChange={handleChange}
                                        className="block w-full pl-10 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={user.email}
                                        onChange={handleChange}
                                        className="block w-full pl-10 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={user.phone || ''}
                                    onChange={handleChange}
                                    className="block w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={user.address || ''}
                                    onChange={handleChange}
                                    className="block w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="123 Tech Street, Silicon Valley"
                                />
                            </div>
                        </div>

                        <hr className="border-slate-100 dark:border-slate-800" />

                        {/* Social Links */}
                        <div>
                            <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-4">Social Profiles</h4>
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">GitHub URL</label>
                                    <input
                                        type="text"
                                        name="github"
                                        value={user.github || ''}
                                        onChange={handleChange}
                                        className="block w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="github.com/username"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">LinkedIn URL</label>
                                    <input
                                        type="text"
                                        name="linkedin"
                                        value={user.linkedin || ''}
                                        onChange={handleChange}
                                        className="block w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="linkedin.com/in/username"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Twitter URL</label>
                                    <input
                                        type="text"
                                        name="twitter"
                                        value={user.twitter || ''}
                                        onChange={handleChange}
                                        className="block w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="twitter.com/username"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Security */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={user.password}
                                    onChange={handleChange}
                                    placeholder="Leave blank to keep current password"
                                    className="block w-full pl-10 pr-10 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff className="h-4 w-4 text-slate-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center justify-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
