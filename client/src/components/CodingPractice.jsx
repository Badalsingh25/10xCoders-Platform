import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { Play, RotateCcw, Save, Terminal, AlertCircle, CheckCircle } from 'lucide-react';

const CodingPractice = () => {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('// Write your code here\nconsole.log("Hello, 10xCoders!");');
  const [output, setOutput] = useState('');
  const [stdin, setStdin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const languages = [
    { id: 'javascript', name: 'JavaScript', defaultCode: '// Write your JavaScript code here\nconsole.log("Hello, World!");' },
    { id: 'python', name: 'Python', defaultCode: '# Write your Python code here\nprint("Hello, World!")' },
    { id: 'java', name: 'Java', defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}' },
    { id: 'cpp', name: 'C++', defaultCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}' },
    { id: 'c', name: 'C', defaultCode: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}' }
  ];

  const handleLanguageChange = (e) => {
    const selectedLang = languages.find(l => l.id === e.target.value);
    setLanguage(selectedLang.id);
    setCode(selectedLang.defaultCode);
    setOutput('');
    setStatus('');
    setError('');
  };

  const handleRunCode = async () => {
    setIsLoading(true);
    setOutput('');
    setError('');
    setStatus('Running...');

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };

      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/judge/execute`, {
        source_code: code,
        language: language,
        stdin: stdin
      }, config);

      const result = response.data;

      // Handle Piston response structure
      if (result.stderr) {
        setError(result.stderr);
        setStatus('Error');
      } else {
        setOutput(result.stdout || 'No output');
        setStatus(result.status?.description || 'Success');
      }

    } catch (err) {
      console.error('Execution failed:', err);
      setError(err.response?.data?.details || err.message || 'Failed to execute code');
      setStatus('Failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Coding Practice
            </h1>
            <p className="mt-2 text-gray-600">Write, compile, and run code in multiple languages.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)] min-h-[600px]">

          {/* Editor Section */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <select
                  value={language}
                  onChange={handleLanguageChange}
                  className="block w-40 px-3 py-1.5 text-base text-gray-900 border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
                >
                  {languages.map(lang => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRunCode}
                  disabled={isLoading}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Running...
                    </>
                  ) : (
                    <>
                      <Play size={16} className="mr-2" />
                      Run Code
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 relative">
              <Editor
                height="100%"
                language={language === 'c' || language === 'cpp' ? 'cpp' : language}
                value={code}
                onChange={(value) => setCode(value)}
                theme="vs-light"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>

          {/* Sidebar: Output & Input */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">

            {/* Status Bar */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={18} />
                Console
              </div>
              {status && (
                <span className={`text-xs px-2 py-1 rounded-full ${status === 'Error' || status === 'Runtime Error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {status}
                </span>
              )}
            </div>

            {/* Output Area */}
            <div className={`flex-1 p-4 font-mono text-sm overflow-auto ${error ? 'bg-red-50 text-red-900' : 'bg-gray-900 text-green-400'}`}>
              {error ? (
                <pre className="whitespace-pre-wrap">{error}</pre>
              ) : output ? (
                <pre className="whitespace-pre-wrap">{output}</pre>
              ) : (
                <div className="text-gray-500 italic mt-8 text-center">
                  Click "Run Code" to see output here...
                </div>
              )}
            </div>

            {/* Stdin Area */}
            <div className="border-t border-gray-200">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                Input (stdin)
              </div>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                className="w-full h-32 p-3 font-mono text-sm border-0 focus:ring-0 resize-none bg-white text-gray-800"
                placeholder="Enter input for your program here..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodingPractice;