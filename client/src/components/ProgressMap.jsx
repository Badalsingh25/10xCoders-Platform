import React from 'react';
import { motion } from 'framer-motion';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { CheckCircle, Lock, Clock, Flame, Trophy, Zap, TrendingUp, BookOpen } from 'lucide-react';

const ProgressMap = ({ stats, isDashboard = false }) => {

    // --- 1. Overall Data (Circular) ---
    // If Dashboard, strict real data. For Home (public), keep demo (68).
    const overallValue = isDashboard ? (stats?.overallProgress || 0) : 68;

    const overallData = [
        { name: 'Completed', value: overallValue, color: '#10b981' }, // Emerald-500
        { name: 'Remaining', value: 100 - overallValue, color: '#f1f5f9' }, // Slate-100
    ];

    // --- 2. Skill Data ---
    // Demo Skills for Home Page
    const demoSkills = [
        { name: 'Java', progress: 85, color: 'bg-emerald-500' },
        { name: 'React', progress: 65, color: 'bg-teal-500' },
        { name: 'DSA', progress: 45, color: 'bg-green-500' },
        { name: 'System Design', progress: 30, color: 'bg-lime-500' },
    ];

    // Real Skills
    // If Dashboard & no skills, show empty is cleaner than fake "HTML 0%".
    // But to avoid layout collapse, if empty, we can show a placeholder or just empty.
    const skills = isDashboard ? (stats?.skills || []) : demoSkills;


    // --- 3. Badges Data (Dynamic) ---
    // Calculate earned status based on real metrics
    const badgesList = [
        { name: 'First Steps', icon: '🌱', earned: true, desc: 'Joined the platform' },
        { name: 'Code Warrior', icon: '💻', earned: overallValue > 10, desc: 'Completed 10% Course' },
        { name: 'Streak Master', icon: '🔥', earned: (stats?.streak?.current || 0) >= 7, desc: '7 Day Streak' },
        { name: 'Polyglot', icon: '🌐', earned: (stats?.activityLog?.some(l => l.action === 'code_translation')) || false, desc: 'Translated Code' },
        { name: 'Resume Builder', icon: '📄', earned: (stats?.savedResumes?.length > 0) || false, desc: 'Created a Resume' },
        { name: 'Bug Hunter', icon: '🐛', earned: (stats?.gamification?.points || 0) > 50, desc: 'Earn 50 XP' },
        { name: 'Interview Pro', icon: '🎙️', earned: (stats?.gamification?.points || 0) > 200, desc: 'Earn 200 XP' }
    ];

    // If user has actual badges array from backend, merge/use them? 
    // For now, calculating them client-side based on stats is robust enough for "realistic" feel without complex backend badge system.

    // --- 4. Weekly Activity Data ---
    const demoActivity = [
        { day: 'Mon', minutes: 45 },
        { day: 'Tue', minutes: 60 },
        { day: 'Wed', minutes: 30 },
        { day: 'Thu', minutes: 90 },
        { day: 'Fri', minutes: 120 },
        { day: 'Sat', minutes: 15 },
        { day: 'Sun', minutes: 50 },
    ];

    const weeklyActivity = isDashboard ? (stats?.weeklyActivity || []) : demoActivity;

    return (
        <section className={`${isDashboard ? '' : 'py-16'} bg-transparent transition-colors`} id="progress-map">
            <div className={`${isDashboard ? 'w-full' : 'w-full max-w-[95%] mx-auto px-4 sm:px-6 lg:px-12'}`}>

                {/* Header - Only for Home Page */}
                {!isDashboard && (
                    <div className="text-center mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-block p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-4"
                        >
                            <TrendingUp size={32} />
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4"
                        >
                            Visualize Your Learning Journey
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
                        >
                            Track your skills, streaks, and course completion with our advanced multi-layer progress mapping system.
                        </motion.p>
                    </div>
                )}

                {/* Grid Layout */}
                <div className={`grid grid-cols-1 ${isDashboard ? 'grid-cols-1 xl:grid-cols-2 gap-6' : 'lg:grid-cols-3 gap-8'}`}>

                    {/* 1. Overall Progress (Circular with Glow) */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className={`${isDashboard ? '' : 'p-8'} bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden`}
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Trophy className="text-yellow-500" size={24} /> Overall Progress
                            </h3>
                            {stats?.gamification && (
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full uppercase tracking-wider">
                                    {stats.gamification.level} • {stats.gamification.points} XP
                                </span>
                            )}
                        </div>

                        <div className="relative h-64 flex justify-center items-center">
                            {/* Simple clean background ring */}
                            <div className="absolute w-[200px] h-[200px] rounded-full border-[10px] border-slate-100 dark:border-slate-700"></div>

                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={overallData}
                                        innerRadius={80}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        startAngle={90}
                                        endAngle={-270}
                                        cornerRadius={10}
                                    >
                                        {overallData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-extrabold text-slate-900 dark:text-white drop-shadow-sm">{overallValue}%</span>
                                <span className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Completion</span>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-center gap-8 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div> Completed
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-600"></div> Remaining
                            </div>
                        </div>
                    </motion.div>

                    {/* 2. Skill-Wise Progress (Premium Design) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className={`${isDashboard ? 'xl:col-span-1' : 'lg:col-span-2'} bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between`}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Zap className="text-yellow-500" size={24} /> Skill Mastery
                            </h3>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Rank</span>
                        </div>

                        <div className="space-y-5">
                            {skills.map((skill, idx) => (
                                <div key={idx} className="group">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="font-bold text-slate-700 dark:text-slate-300 text-sm tracking-wide">{skill.name}</span>
                                        <span className={`font-mono font-bold text-lg ${skill.progress >= 80 ? 'text-yellow-500' : 'text-slate-600 dark:text-slate-400'}`}>
                                            {skill.progress}%
                                        </span>
                                    </div>
                                    <div className="w-full h-8 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] bg-slate-100 dark:bg-slate-700/50 rounded-sm relative overflow-hidden border border-slate-200 dark:border-slate-600">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${skill.progress}%` }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 1.2, ease: "easeOut" }}
                                            className={`h-full ${skill.progress >= 80 ? 'bg-slate-800 dark:bg-white' : 'bg-slate-600 dark:bg-slate-400'} relative`}
                                        >
                                            {/* Striped Pattern Overlay */}
                                            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:10px_10px]"></div>
                                        </motion.div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Gamification / Next Badge */}
                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">Next Milestone</p>
                                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">GOLD</span>
                                        React Master
                                    </h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-400">Points to go</p>
                                    <p className="font-mono font-bold text-emerald-500">+120 XP</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* 3. Learning Path Roadmap (Full Width & Interactive) */}
                    {/* 3. Achievements & Badges Collection (Replaces Roadmap) */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className={`${isDashboard ? 'xl:col-span-2' : 'lg:col-span-3'} bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden`}
                    >
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Trophy className="text-yellow-500" size={24} /> Recent Achievements
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">Earn badges by completing challenges and maintaining streaks.</p>
                            </div>
                            <button className="text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline">
                                View All Badges
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {badgesList.map((badge, idx) => (
                                <div key={idx} className={`p-4 rounded-2xl border transition-all relative group
                                     ${badge.earned
                                        ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/10 dark:to-amber-900/10 border-yellow-200 dark:border-yellow-800/30'
                                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 grayscale opacity-70'}`}>

                                    <div className="text-3xl mb-3">{badge.icon}</div>
                                    <h4 className={`font-bold text-sm mb-1 ${badge.earned ? 'text-slate-900 dark:text-yellow-100' : 'text-slate-500 text-slate-700 dark:text-slate-400'}`}>
                                        {badge.name}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 leading-tight">{badge.desc}</p>

                                    {!badge.earned && (
                                        <div className="absolute top-2 right-2 text-slate-300">
                                            <Lock size={12} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* 4. Weekly Activity Heatmap (Full Width for Impact) */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className={`${isDashboard ? 'xl:col-span-2' : 'lg:col-span-3'} bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm`}
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Flame className="text-orange-500" size={24} /> Weekly Activity
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">Your learning consistency this week</p>
                            </div>
                            <span className="text-sm font-bold px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl border border-orange-100 dark:border-orange-800/50 flex items-center gap-2">
                                🔥 4 Day Streak!
                            </span>
                        </div>

                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyActivity} barSize={40}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="day"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
                                        dy={15}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc', opacity: 0.8 }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px 16px' }}
                                        itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                                        formatter={(value) => [`${value} mins`, 'Learning Time']}
                                    />
                                    <Bar
                                        dataKey="minutes"
                                        radius={[8, 8, 8, 8]}
                                    >
                                        {weeklyActivity.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.minutes > 60 ? '#10b981' : entry.minutes > 30 ? '#34d399' : '#86efac'}
                                                className="hover:opacity-80 transition-opacity cursor-pointer"
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
};

export default ProgressMap;
