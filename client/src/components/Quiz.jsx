import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, Brain, Clock, ChevronRight, CheckCircle, XCircle, AlertCircle, Loader, RefreshCw, FileText, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Quiz = () => {
    // Steps: 'setup', 'loading', 'quiz', 'analyzing', 'results'
    const [step, setStep] = useState('setup');
    const [config, setConfig] = useState({
        type: 'TOPIC', // 'TOPIC' or 'RESUME'
        topic: '',
        resumeSkills: '',
        difficulty: 'Intermediate',
        count: 5
    });

    const [quizData, setQuizData] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionIndex: selectedOption }
    const [timer, setTimer] = useState(0);
    const [analysis, setAnalysis] = useState(null);

    // Timer logic
    useEffect(() => {
        let interval;
        if (step === 'quiz') {
            interval = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [step]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleStartQuiz = async () => {
        if (config.type === 'TOPIC' && !config.topic) return alert("Please enter a topic");
        if (config.type === 'RESUME' && !config.resumeSkills) return alert("Please enter your top skills");

        setStep('loading');
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5001/api/quiz/generate', config, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQuizData(res.data);
            setTimer(0);
            setAnswers({});
            setCurrentQuestion(0);
            setStep('quiz');
        } catch (error) {
            console.error(error);
            alert("Failed to generate quiz. Please try again.");
            setStep('setup');
        }
    };

    const handleAnswer = (option) => {
        setAnswers({ ...answers, [currentQuestion]: option });
    };

    const handleNext = () => {
        if (currentQuestion < quizData.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        setStep('analyzing');
        const token = localStorage.getItem('token');

        // Calculate basic score locally first
        let correctCount = 0;
        quizData.forEach((q, idx) => {
            if (answers[idx] === q.correctAnswer) correctCount++;
        });
        const score = Math.round((correctCount / quizData.length) * 100);

        try {
            // 1. Get AI Analysis
            const analyzeRes = await axios.post('http://localhost:5001/api/quiz/analyze', {
                topic: config.topic || "Skills Assessment",
                questions: quizData,
                userAnswers: answers
            }, { headers: { Authorization: `Bearer ${token}` } });

            const analysisResult = analyzeRes.data;
            setAnalysis({ ...analysisResult, score, correctCount });

            // 2. Save Result
            await axios.post('http://localhost:5001/api/quiz/submit', {
                topic: config.topic || "Resume Skills",
                difficulty: config.difficulty,
                score,
                totalQuestions: quizData.length,
                weakAreas: analysisResult.weakAreas,
                improvementTips: analysisResult.improvementTips
            }, { headers: { Authorization: `Bearer ${token}` } });

            setStep('results');

        } catch (error) {
            console.error(error);
            alert("Error submitting quiz.");
            setStep('setup');
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900 py-8 px-4 font-sans">
            <div className="max-w-3xl mx-auto">

                {/* SETUP STEP */}
                {step === 'setup' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700">
                        <div className="text-center mb-10">
                            <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-pink-600 dark:text-pink-400">
                                <Award size={32} />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">AI Skill Assessment</h1>
                            <p className="text-slate-600 dark:text-slate-400">Validate your knowledge with AI-driven quizzes that adapt to your skills.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <button
                                onClick={() => setConfig({ ...config, type: 'TOPIC' })}
                                className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${config.type === 'TOPIC'
                                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-pink-200 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'}`}
                            >
                                <Code size={24} />
                                <div className="text-left">
                                    <div className="font-bold">Topic Quiz</div>
                                    <div className="text-xs opacity-70">Focus on one subject</div>
                                </div>
                            </button>
                            <button
                                onClick={() => setConfig({ ...config, type: 'RESUME' })}
                                className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${config.type === 'RESUME'
                                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-pink-200 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'}`}
                            >
                                <FileText size={24} />
                                <div className="text-left">
                                    <div className="font-bold">Resume Quiz</div>
                                    <div className="text-xs opacity-70">Based on your skills</div>
                                </div>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {config.type === 'TOPIC' ? (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Topic</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Java Streams, React Hooks, System Design"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-pink-500 dark:text-white"
                                        value={config.topic}
                                        onChange={e => setConfig({ ...config, topic: e.target.value })}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">My Top Skills</label>
                                    <textarea
                                        placeholder="e.g. JavaScript, Python, AWS (or paste from resume)"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-pink-500 dark:text-white resize-none h-24"
                                        value={config.resumeSkills}
                                        onChange={e => setConfig({ ...config, resumeSkills: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Difficulty</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-pink-500 dark:text-white"
                                        value={config.difficulty}
                                        onChange={e => setConfig({ ...config, difficulty: e.target.value })}
                                    >
                                        <option>Beginner</option>
                                        <option>Intermediate</option>
                                        <option>Advanced</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Questions</label>
                                    <select
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-pink-500 dark:text-white"
                                        value={config.count}
                                        onChange={e => setConfig({ ...config, count: parseInt(e.target.value) })}
                                    >
                                        <option value={3}>3 Questions</option>
                                        <option value={5}>5 Questions</option>
                                        <option value={10}>10 Questions</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={handleStartQuiz}
                                className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:scale-[1.02] transition-all"
                            >
                                Start Assessment
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* LOADING STEP */}
                {step === 'loading' && (
                    <div className="flex flex-col items-center justify-center h-96">
                        <Loader className="w-12 h-12 text-pink-500 animate-spin mb-4" />
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Generating Quiz...</h3>
                        <p className="text-slate-500">Our AI is crafting questions based on your request.</p>
                    </div>
                )}

                {/* QUIZ STEP */}
                {step === 'quiz' && quizData.length > 0 && (
                    <div className="max-w-2xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Question {currentQuestion + 1} of {quizData.length}
                            </span>
                            <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20 px-3 py-1 rounded-full text-sm font-mono">
                                <Clock size={16} />
                                {formatTime(timer)}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full mb-8 overflow-hidden">
                            <motion.div
                                className="h-full bg-pink-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentQuestion + 1) / quizData.length) * 100}%` }}
                            />
                        </div>

                        <motion.div
                            key={currentQuestion}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 mb-6"
                        >
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 leading-relaxed">
                                {quizData[currentQuestion].question}
                            </h2>

                            <div className="space-y-3">
                                {quizData[currentQuestion].options.map((option, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswer(option)}
                                        className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${answers[currentQuestion] === option
                                                ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-900 dark:text-pink-100'
                                                : 'border-slate-100 dark:border-slate-700 hover:border-pink-200 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
                                            }`}
                                    >
                                        <span className={`dark:text-slate-300 ${answers[currentQuestion] === option ? 'font-medium' : ''}`}>
                                            {option}
                                        </span>
                                        {answers[currentQuestion] === option && <CheckCircle size={20} className="text-pink-500" />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>

                        <div className="flex justify-end">
                            <button
                                onClick={handleNext}
                                disabled={!answers[currentQuestion]}
                                className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                            >
                                {currentQuestion === quizData.length - 1 ? 'Finish Quiz' : 'Next Question'}
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ANALYZING STEP */}
                {step === 'analyzing' && (
                    <div className="flex flex-col items-center justify-center h-96">
                        <Brain className="w-16 h-16 text-indigo-500 animate-pulse mb-6" />
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Analyzing Performance</h3>
                        <p className="text-slate-500 max-w-md text-center">Our AI is reviewing your answers to identify strong points and weak areas...</p>
                    </div>
                )}

                {/* RESULTS STEP */}
                {step === 'results' && analysis && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto">

                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                            {/* Score Card */}
                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 md:col-span-1 text-center">
                                <div className="text-sm text-slate-500 font-medium uppercase tracking-wider mb-4">Your Score</div>
                                <div className="relative inline-flex items-center justify-center">
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-slate-100 dark:text-slate-700" />
                                        <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-pink-500" strokeDasharray={351} strokeDashoffset={351 - (351 * analysis.score) / 100} strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute text-3xl font-bold text-slate-900 dark:text-white">{analysis.score}%</div>
                                </div>
                                <div className="mt-4 text-slate-600 dark:text-slate-400">
                                    {analysis.correctCount} out of {quizData.length} correct
                                </div>
                            </div>

                            {/* AI Feedback Card */}
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 shadow-lg text-white md:col-span-2 relative overflow-hidden">
                                <BotIcon className="absolute right-[-20px] bottom-[-20px] text-white/10 w-40 h-40" />
                                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                    <Brain size={24} /> AI Evaluation
                                </h3>
                                <div className="space-y-4 relative z-10">
                                    <div>
                                        <div className="text-white/70 text-sm font-bold uppercase tracking-wide mb-1">Improvement Tips</div>
                                        <p className="text-indigo-50 leading-relaxed text-lg">{analysis.improvementTips}</p>
                                    </div>

                                    {analysis.weakAreas.length > 0 && (
                                        <div className="mt-4">
                                            <div className="text-white/70 text-sm font-bold uppercase tracking-wide mb-2">Focus Areas</div>
                                            <div className="flex flex-wrap gap-2">
                                                {analysis.weakAreas.map((area, i) => (
                                                    <span key={i} className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm">
                                                        {area}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Review Answers */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white px-2">Review Answers</h3>
                            {quizData.map((q, idx) => (
                                <div key={idx} className={`p-6 rounded-2xl border ${answers[idx] === q.correctAnswer
                                        ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                                        : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                                    }`}>
                                    <div className="flex gap-4">
                                        <div className="mt-1">
                                            {answers[idx] === q.correctAnswer
                                                ? <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                                                : <XCircle className="text-red-600 dark:text-red-400" size={24} />
                                            }
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-200 text-lg mb-2">{q.question}</p>
                                            <div className="text-sm space-y-1 mb-3">
                                                <p className="text-slate-500 dark:text-slate-400">Your Answer: <span className="font-medium">{answers[idx]}</span></p>
                                                {answers[idx] !== q.correctAnswer && (
                                                    <p className="text-green-600 dark:text-green-400">Correct Answer: <span className="font-medium">{q.correctAnswer}</span></p>
                                                )}
                                            </div>
                                            <div className="p-3 bg-white/50 dark:bg-black/20 rounded-lg text-sm text-slate-600 dark:text-slate-300">
                                                <span className="font-bold mr-2">Explanation:</span>
                                                {q.explanation}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-center mt-10 mb-10">
                            <button
                                onClick={() => setStep('setup')}
                                className="px-8 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-full font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
                            >
                                <RefreshCw size={20} /> Take Another Assessment
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

const BotIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></svg>
);

export default Quiz;
