import React from 'react';
import { motion } from 'framer-motion';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { CheckCircle, Lock, Clock, Flame, Trophy, Zap, TrendingUp, BookOpen } from 'lucide-react';

const ProgressMap = ({ stats, isDashboard = false }) => {

    // --- 1. Overall Data (Circular) ---
    // Rule: If stats exists, use it. If Dashboard & no stats, use 0. If Home & no stats, use Demo (68).
    const overallValue = stats ? (stats.overallProgress ?? 0) : (isDashboard ? 0 : 68);

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

    // Use stats skills if available. If Dashboard & empty, use empty array. If Home & empty, use demo.
    const skills = stats?.skills?.length > 0 ? stats.skills : (isDashboard ? [] : demoSkills);

    // Smart Color Logic helper - Enforcing Green Theme
    const getSkillColor = (progress) => {
        if (progress >= 80) return 'bg-emerald-500';
        if (progress >= 40) return 'bg-emerald-400';
        return 'bg-emerald-300';
    };

    // --- 3. Roadmap Data ---
    // For Dashboard, we ideally want dynamic status. For now, strictly for NEW users, we can default all to 'locked' or 'in-progress'.
    // Since we don't have dynamic roadmap props yet, let's keep the static one but maybe reset it if overallValue is 0?
    // User complained about "showing this even if I have not started".
    // Let's make it smarter: If overallValue is 0, reset roadmap to step 1.

    const defaultRoadmap = [
        { step: 'HTML', status: 'completed' },
        { step: 'CSS', status: 'completed' },
        { step: 'JavaScript', status: 'in-progress' },
        { step: 'React', status: 'locked' },
        { step: 'Backend', status: 'locked' },
    ];

    const emptyRoadmap = [
        { step: 'HTML', status: 'in-progress' }, // Start at step 1
        { step: 'CSS', status: 'locked' },
        { step: 'JavaScript', status: 'locked' },
        { step: 'React', status: 'locked' },
        { step: 'Backend', status: 'locked' },
    ];

    const roadmap = (isDashboard && overallValue === 0) ? emptyRoadmap : defaultRoadmap;

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

    const zeroActivity = [
        { day: 'Mon', minutes: 0 },
        { day: 'Tue', minutes: 0 },
        { day: 'Wed', minutes: 0 },
        { day: 'Thu', minutes: 0 },
        { day: 'Fri', minutes: 0 },
        { day: 'Sat', minutes: 0 },
        { day: 'Sun', minutes: 0 },
    ];

    const weeklyActivity = stats?.weeklyActivity && stats.weeklyActivity.length > 0
        ? stats.weeklyActivity
        : (isDashboard ? zeroActivity : demoActivity);

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
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">Total Courses: 12</span>
                        </div>

                        <div className="relative h-64 flex justify-center items-center">
                            {/* Outer Glow Ring */}
                            <div className="absolute w-[220px] h-[220px] rounded-full border-2 border-emerald-100 dark:border-emerald-900/30 blur-sm animate-pulse"></div>

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

                    {/* 2. Skill-Wise Progress & Smart Insights */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className={`${isDashboard ? 'xl:col-span-1' : 'lg:col-span-2'} bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between`}
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Zap className="text-emerald-500" size={24} /> Skill Mastery
                            </h3>
                            <button className="text-emerald-600 dark:text-emerald-400 text-sm font-bold hover:underline">View Details</button>
                        </div>

                        <div className="space-y-6">
                            {skills.map((skill, idx) => (
                                <div key={idx} className="group cursor-default">
                                    <div className="flex justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-700 dark:text-slate-300">{skill.name}</span>
                                            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                Last improved 2d ago
                                            </span>
                                        </div>
                                        <span className={`font-bold ${skill.progress >= 80 ? 'text-emerald-600' : 'text-emerald-500'
                                            }`}>
                                            {skill.progress}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${skill.progress}%` }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 1.5, ease: "circOut" }}
                                            className={`h-full ${getSkillColor(skill.progress)} rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
                                        ></motion.div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* AI Coach Insight Card */}
                        <div className="mt-8 p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 flex items-start gap-4 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="bg-white dark:bg-emerald-900/50 p-3 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-800 text-2xl">
                                🤖
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                                    AI Coach Insight <span className="text-emerald-600 text-xs bg-emerald-100 px-2 py-0.5 rounded-full">High Confidence</span>
                                </h4>
                                <p className="text-slate-600 dark:text-slate-300 text-sm mt-2 leading-relaxed">
                                    "You're improving rapidly in <strong className="text-emerald-600 dark:text-emerald-400">Java</strong>! 🚀 Complete 2 more medium-level challenges to unlock the <strong>'Advanced Backend Badge'</strong>."
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* 3. Learning Path Roadmap (Full Width & Interactive) */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className={`${isDashboard ? 'xl:col-span-2' : 'lg:col-span-3'} bg-emerald-600 rounded-3xl p-8 text-white relative overflow-hidden`}
                    >
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-4">
                            <div>
                                <h3 className="text-2xl font-bold flex items-center gap-3">
                                    Full Stack Roadmap Progress
                                </h3>
                                <p className="text-emerald-100 mt-1">Keep going! You're 3 steps away from React Mastery.</p>
                            </div>
                            <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm transition px-4 py-2 rounded-lg text-sm font-semibold">
                                View Full Path
                            </button>
                        </div>

                        <div className="relative z-10 w-full py-8">
                            {/* Connecting Line */}
                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-emerald-800/50 -translate-y-1/2 rounded-full mx-6 md:mx-8"></div>
                            <div className="absolute top-1/2 left-0 w-[20%] h-1 bg-white -translate-y-1/2 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)] mx-6 md:mx-8"></div>

                            <div className="flex justify-between relative w-full px-0 sm:px-2">
                                {roadmap.map((item, idx) => (
                                    <div key={idx} className={`relative flex flex-col items-center group ${item.status === 'locked' ? 'opacity-70 blur-[0.5px] hover:blur-none transition-all' : ''}`}>

                                        {/* Status Icon Circle */}
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold border-4 transition-all z-10 shadow-lg cursor-pointer
                                            ${item.status === 'completed' ? 'bg-white text-emerald-600 border-white scale-100' :
                                                item.status === 'in-progress' ? 'bg-emerald-600 text-white border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.4)] animate-pulse-slow' :
                                                    'bg-emerald-900 border-emerald-800 text-white/30'}`}
                                        >
                                            {item.status === 'completed' ? <CheckCircle size={24} strokeWidth={3} /> :
                                                item.status === 'locked' ? <Lock size={20} /> :
                                                    idx + 1}
                                        </div>

                                        {/* Label */}
                                        <div className={`absolute top-20 flex flex-col items-center transition-all duration-300
                                            ${item.status === 'in-progress' ? '-translate-y-1' : ''}`}>
                                            <span className={`text-sm font-bold whitespace-nowrap px-3 py-1 rounded-full 
                                                ${item.status === 'in-progress' ? 'bg-white text-emerald-700 shadow-md' : 'text-white'}`}>
                                                {item.step}
                                            </span>
                                            {item.status === 'locked' && (
                                                <span className="text-[10px] text-emerald-200 mt-1 uppercase tracking-wider">Locked</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
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
