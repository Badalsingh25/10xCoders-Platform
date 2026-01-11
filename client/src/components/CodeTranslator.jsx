import React, { useState } from 'react';
import Editor from "@monaco-editor/react";
import axios from "axios";
import { ArrowRight, Copy, Check, Sparkles, Download, Code2, AlertTriangle, Loader2, RefreshCw, Zap } from 'lucide-react';
import API_URL from '../config/api';

const languages = [
    { label: "Java", value: "java" },
    { label: "Python", value: "python" },
    { label: "C", value: "c" },
    { label: "C++", value: "cpp" },
    { label: "JavaScript", value: "javascript" },
    { label: "TypeScript", value: "typescript" },
    { label: "Go", value: "go" },
    { label: "Rust", value: "rust" },
    { label: "C#", value: "csharp" },
];

const CodeTranslator = () => {
    const [sourceCode, setSourceCode] = useState("// Paste your code here...");
    const [sourceLang, setSourceLang] = useState("java");
    const [targetLang, setTargetLang] = useState("python");
    const [result, setResult] = useState("");
    const [explanation, setExplanation] = useState("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleConvert = async () => {
        if (!sourceCode.trim()) return;
        setLoading(true);
        setResult("");
        setExplanation("");

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/api/ai/translate`,
                {
                    sourceCode,
                    sourceLang,
                    targetLang,
                    includeExplanation: true
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                });

            if (res.data.convertedCode) {
                setResult(res.data.convertedCode);
                setExplanation(res.data.explanation || "");
            }
        } catch (err) {
            console.error(err);
            setResult("// Error converting code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4 sm:px-6 lg:px-8 pt-24 font-sans">
            <div className="max-w-[1600px] mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 flex items-center gap-3">
                            <Code2 className="text-indigo-600 dark:text-indigo-400 w-10 h-10" />
                            Code Translator
                        </h1>
                        <p className="mt-2 text-slate-600 dark:text-slate-400 text-lg">
                            Seamlessly convert logic across languages with AI precision.
                        </p>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <select
                            value={sourceLang}
                            onChange={(e) => setSourceLang(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-900 border-none rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            {languages.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>

                        <ArrowRight className="text-slate-400 w-5 h-5" />

                        <select
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-900 border-none rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            {languages.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>

                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

                        <button
                            onClick={handleConvert}
                            disabled={loading || !sourceCode.trim()}
                            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                        >
                            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Zap className="w-5 h-5 fill-current" />}
                            {loading ? "Translating..." : "Translate"}
                        </button>
                    </div>
                </div>

                {/* Main Editor Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-280px)] min-h-[600px]">

                    {/* Source Editor */}
                    <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xl bg-white dark:bg-slate-800">
                        <div className="bg-slate-100/50 dark:bg-slate-800/50 p-3 px-5 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 backdrop-blur-sm">
                            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${sourceCode ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                                {languages.find(l => l.value === sourceLang)?.label || 'Source'}
                            </span>
                        </div>
                        <div className="flex-1 relative group">
                            <Editor
                                height="100%"
                                language={sourceLang}
                                theme="vs-dark"
                                value={sourceCode}
                                onChange={(val) => setSourceCode(val)}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 15,
                                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                    padding: { top: 20, bottom: 20 },
                                    scrollBeyondLastLine: false,
                                    smoothScrolling: true,
                                    cursorBlinking: "smooth",
                                    cursorSmoothCaretAnimation: "on"
                                }}
                            />
                        </div>
                    </div>

                    {/* Target Editor */}
                    <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xl bg-white dark:bg-slate-800 relative">
                        <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-3 px-5 flex justify-between items-center border-b border-indigo-100 dark:border-indigo-900/30 backdrop-blur-sm">
                            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                {languages.find(l => l.value === targetLang)?.label || 'Target'} Output
                            </span>

                            {result && (
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? "Copied!" : "Copy Code"}
                                </button>
                            )}
                        </div>

                        <div className="flex-1 relative">
                            {/* Loading Overlay */}
                            {loading && (
                                <div className="absolute inset-0 z-50 bg-slate-900/20 dark:bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center">
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-loading-bar"></div>
                                        <RefreshCw className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin mb-4" />
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Analyzing Logic...</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Converting from {sourceLang} to {targetLang}</p>
                                    </div>
                                </div>
                            )}

                            <Editor
                                height="100%"
                                language={targetLang}
                                theme="vs-dark"
                                value={result}
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    fontSize: 15,
                                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                    padding: { top: 20, bottom: 20 },
                                    scrollBeyondLastLine: false,
                                    renderLineHighlight: "none"
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* AI Insight / Explanation Section */}
                {explanation && (
                    <div className="mt-8 animate-fade-in-up">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 px-6 py-4 flex items-center gap-3 border-b border-amber-100 dark:border-amber-900/30">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Change Analysis</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Key logic adaptations and syntax changes</p>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="prose dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                    {explanation}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodeTranslator;
