import React, { useState } from 'react';
import Editor from "@monaco-editor/react";
import axios from "axios";
import { ArrowRight, Copy, Check, Sparkles, Download, Code2, AlertTriangle, Loader2 } from 'lucide-react';

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
    const [mode, setMode] = useState("convert"); // 'convert' or 'explain'

    const handleConvert = async () => {
        if (!sourceCode.trim()) return;
        setLoading(true);
        setResult("");
        setExplanation("");

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/ai/translate`,
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 pt-24">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                        <Sparkles className="text-indigo-600 w-8 h-8" />
                        AI Code Translator
                    </h1>
                    <p className="mt-4 text-slate-600 dark:text-slate-400">
                        Convert code between languages instantly while preserving logic and best practices.
                    </p>
                </div>

                {/* Controls */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="flex-1 sm:w-48">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Source Language</label>
                            <select
                                value={sourceLang}
                                onChange={(e) => setSourceLang(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm"
                            >
                                {languages.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                            </select>
                        </div>

                        <ArrowRight className="text-slate-400 w-5 h-5 mt-5" />

                        <div className="flex-1 sm:w-48">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Target Language</label>
                            <select
                                value={targetLang}
                                onChange={(e) => setTargetLang(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm"
                            >
                                {languages.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleConvert}
                        disabled={loading}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                        {loading ? "Translating..." : "Translate Code"}
                    </button>
                </div>

                {/* Editors */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
                    {/* Source */}
                    <div className="flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                        <div className="bg-slate-100 dark:bg-slate-800 p-3 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Code2 className="w-4 h-4" /> Source Code
                            </span>
                        </div>
                        <Editor
                            height="100%"
                            language={sourceLang}
                            theme="vs-dark"
                            value={sourceCode}
                            onChange={(val) => setSourceCode(val)}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                padding: { top: 16 },
                                scrollBeyondLastLine: false
                            }}
                        />
                    </div>

                    {/* Target */}
                    <div className="flex flex-col rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm relative">
                        <div className="bg-slate-100 dark:bg-slate-800 p-3 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Code2 className="w-4 h-4" /> Translated Code
                            </span>
                            {result && (
                                <button
                                    onClick={handleCopy}
                                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
                                    title="Copy Code"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </button>
                            )}
                        </div>
                        <div className="flex-1 relative">
                            {loading && (
                                <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-2" />
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">Converting Logic...</p>
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
                                    fontSize: 14,
                                    padding: { top: 16 },
                                    scrollBeyondLastLine: false
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Explanation Section */}
                {explanation && (
                    <div className="mt-8 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <AlertTriangle className="text-amber-500 w-5 h-5" />
                            Key Changes & Logic
                        </h3>
                        <div className="prose dark:prose-invert max-w-none text-sm text-slate-600 dark:text-slate-300 space-y-2 whitespace-pre-wrap">
                            {explanation}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodeTranslator;
