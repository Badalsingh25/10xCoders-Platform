import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const MachineCode = () => {
  const [code, setCode] = useState('#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}');
  const [outputHistory, setOutputHistory] = useState([]);
  const [error, setError] = useState('');
  const [tokenCount, setTokenCount] = useState(0);
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('c');
  const [isRunning, setIsRunning] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [showSolvedPopup, setShowSolvedPopup] = useState(false);
  const [stdin, setStdin] = useState('');
  const editorRef = useRef(null);

  // Sample coding questions
  const codingQuestions = [
    {
      id: 1,
      title: "Hello World",
      description: "Write a program that prints 'Hello, World!' to the console.",
      language: "c",
      template: '#include <stdio.h>\n\nint main() {\n    // Write your code here\n    \n    return 0;\n}',
      solution: 'printf("Hello, World!");',
      solved: false
    },
    {
      id: 2,
      title: "Sum of Two Numbers",
      description: "Write a program that adds two numbers (5 and 7) and prints the result.",
      language: "c",
      template: '#include <stdio.h>\n\nint main() {\n    // Add 5 and 7 and print the result\n    \n    return 0;\n}',
      solution: 'printf("%d", 5 + 7);',
      solved: false
    },
    {
      id: 3,
      title: "FizzBuzz Simple",
      description: "Print numbers from 1 to 15. For multiples of 3, print 'Fizz' instead. For multiples of 5, print 'Buzz'. For multiples of both, print 'FizzBuzz'.",
      language: "c",
      template: '#include <stdio.h>\n\nint main() {\n    // Implement FizzBuzz for numbers 1-15\n    \n    return 0;\n}',
      solution: 'for (int i = 1; i <= 15; i++) {\n        if (i % 3 == 0 && i % 5 == 0) {\n            printf("FizzBuzz\\n");\n        } else if (i % 3 == 0) {\n            printf("Fizz\\n");\n        } else if (i % 5 == 0) {\n            printf("Buzz\\n");\n        } else {\n            printf("%d\\n", i);\n        }\n    }',
      solved: false
    },
    {
      id: 4,
      title: "Even or Odd",
      description: "Write a program that determines if a number (42) is even or odd and prints the result.",
      language: "c",
      template: '#include <stdio.h>\n\nint main() {\n    int num = 42;\n    // Check if num is even or odd and print the result\n    \n    return 0;\n}',
      solution: 'if (num % 2 == 0) {\n        printf("%d is even\\n", num);\n    } else {\n        printf("%d is odd\\n", num);\n    }',
      solved: false
    },
    {
      id: 5,
      title: "C++ Vector Example",
      description: "Create a vector, add 5 numbers to it, and print them in reverse order.",
      language: "cpp",
      template: '#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    // Create a vector, add 5 numbers to it, and print in reverse\n    \n    return 0;\n}',
      solution: 'vector<int> numbers;\n    for (int i = 1; i <= 5; i++) {\n        numbers.push_back(i);\n    }\n    \n    for (int i = numbers.size() - 1; i >= 0; i--) {\n        cout << numbers[i] << " ";\n    }',
      solved: false
    },
    {
      id: 6,
      title: "Java Hello World",
      description: "Write a Java program that prints 'Hello, World!' to the console.",
      language: "java",
      template: 'public class Main {\n    public static void main(String[] args) {\n        // Write your code here\n        \n    }\n}\n',
      solution: 'System.out.println("Hello, World!");',
      solved: false
    },
    {
      id: 7,
      title: "Python Hello World",
      description: "Write a Python program that prints 'Hello, World!' to the console.",
      language: "python",
      template: 'def main():\n    # Write your code here\n    pass\n\nif __name__ == "__main__":\n    main()\n',
      solution: 'print("Hello, World!")',
      solved: false
    }
  ];

  const [questions, setQuestions] = useState(codingQuestions);

  // Calculate token count (simplified)
  useEffect(() => {
    const calculateTokens = () => {
      if (!code) return 0;
      // Simple tokenization by splitting on whitespace and punctuation
      const tokens = code.split(/[\s\n\t{}();,=<>"'/\\+\-*&|^%!~?\[\]]+/).filter(Boolean);
      return tokens.length;
    };

    setTokenCount(calculateTokens());
  }, [code]);

  // Tab handling
  const handleTab = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;

      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);

      // Set cursor position after inserted tab
      setTimeout(() => {
        editorRef.current.selectionStart = start + 4;
        editorRef.current.selectionEnd = start + 4;
      }, 0);
    }
  };

  // Execute code using self-hosted Judge0 via backend proxy
  const runCode = async () => {
    setIsRunning(true);
    setError('');

    // Add command echo to history
    const commandEntry = { type: 'command', content: `Running code...` };

    // We will conditionally add the input entry later, depending on if we "merge" it into the output
    const rawInputEntry = stdin ? { type: 'input', content: `${stdin}` } : null;
    let inputEntryToAdd = rawInputEntry;

    // Temporary history update to show running state (without input yet)
    setOutputHistory(prev => [...prev, commandEntry]);

    try {
      const response = await fetch('http://localhost:5001/api/judge/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source_code: code,
          language: language,
          stdin: stdin
        })
      });

      const data = await response.json();

      let newOutput = '';
      if (data.error) {
        setError(data.error);
        if (data.details) {
          newOutput = typeof data.details === 'string' ? data.details : JSON.stringify(data.details, null, 2);
        }
      } else {
        // Judge0 response handling
        if (data.stdout) {
          newOutput = data.stdout;
        } else if (data.stderr) {
          newOutput = data.stderr;
        } else if (data.compile_output) {
          setError(data.compile_output);
        } else {
          newOutput = 'Program executed with no output';
        }

        if (data.status && data.status.description !== 'Accepted') {
          setError(`Status: ${data.status.description}`);
        }

        // Check if the current question is solved
        if (selectedQuestion) {
          const question = questions.find(q => q.id === selectedQuestion);
          if (question && !question.solved && (data.stdout && data.stdout.trim() === question.solution)) {
            // Mark question as solved
            const updatedQuestions = questions.map(q =>
              q.id === selectedQuestion ? { ...q, solved: true } : q
            );
            setQuestions(updatedQuestions);
            setShowSolvedPopup(true);
            setTimeout(() => setShowSolvedPopup(false), 3000);
          }
        }
      }

      // Smart Formatting: Attempt to merge STDIN into STDOUT if it looks like a prompt
      // This fixes the "Enter a number: Factorial is: 120" issue by turning it into:
      // "Enter a number: 5"
      // "Factorial is: 120"
      if (stdin && newOutput && !data.error && !data.stderr) {
        // Regex to find a prompt-like pattern at the start of output (text ending in colon, maybe space)
        // We are looking for something like "Enter a number: " followed by more text "Factorial is..."
        // We want to insert the input "\n" in between.
        const promptMatch = newOutput.match(/^(.*?:[\s]*)(.*)/s);

        if (promptMatch) {
          // If found, reconstruct output: Prompt + Input + Newline + Rest
          // Visual: "Enter a number: 5"
          //          "Factorial is: 120"
          newOutput = `${promptMatch[1]}${stdin}\n${promptMatch[2]}`;
          // Since we merged input into output visually, we DON'T need the separate input block
          inputEntryToAdd = null;
        } else {
          // Fallback: If no prompt detected (or output doesn't match), just ensure we don't have
          // the "promptless" look.
          // Also, if the output is just "Enter a number: " (and it ended there?), assume prompt.
          if (newOutput.trim().endsWith(':')) {
            newOutput = `${newOutput} ${stdin}\n`;
            inputEntryToAdd = null;
          }
        }
      }

      // Update history with accurate entries
      setOutputHistory(prev => {
        // New set of entries to append
        const newEntries = [];
        if (inputEntryToAdd) newEntries.push(inputEntryToAdd);
        if (newOutput) newEntries.push({ type: 'output', content: newOutput });
        return [...prev, ...newEntries];
      });

      // Clear stdin after run if successful submit
      setStdin('');

    } catch (err) {
      setError(`Failed to connect to execution server: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearOutput = () => {
    setOutputHistory([]);
    setError('');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleQuestions = () => {
    setShowQuestions(!showQuestions);
  };

  const selectQuestion = (id) => {
    const question = questions.find(q => q.id === id);
    if (question) {
      setSelectedQuestion(id);
      setLanguage(question.language);
      setCode(question.template);
      setOutputHistory([]);
      setError('');
    }
  };

  // Track coding time
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Update every 30 seconds (0.5 minutes = 0.5/60 = 1/120 hours)
    const interval = setInterval(async () => {
      try {
        await axios.put('http://localhost:5001/api/users/coding-hours', {
          hours: 1 / 120
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed to update hours", err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col min-h-screen pt-20 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'}`}>

      {/* Header (VS Code Toolbar Style) */}
      <div className={`flex justify-between items-center px-4 py-3 border-b-2 shadow-sm ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">Terminal Code Editor</h1>
          {/* Language Selector */}
          <select
            className={`px-3 py-1.5 rounded-md text-sm font-medium border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${theme === 'dark' ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'}`}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="c">C</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="python">Python</option>
          </select>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-md transition-colors ${theme === 'dark' ? 'hover:bg-gray-700 text-yellow-400' : 'hover:bg-gray-100 text-slate-600'}`}
            title="Toggle Theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Right Toolbar Area */}
        <div className="flex items-center space-x-4">
          {/* Status / Token Info */}
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-xs font-semibold opacity-70">Tokens: {tokenCount}</span>
          </div>

          {/* Run Button (Enhanced) */}
          <button
            onClick={runCode}
            disabled={isRunning}
            className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center shadow-lg transform transition-all hover:scale-105 active:scale-95 ${theme === 'dark'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500'
              : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white disabled:from-gray-200 disabled:to-gray-300 disabled:text-gray-400'
              }`}
          >
            {isRunning ? (
              <>
                <span className="animate-spin mr-2">⏳</span> Running...
              </>
            ) : (
              <>
                <span className="mr-2 text-lg">▶</span> Run Code
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">


        {/* Editor */}
        <div className={`w-2/3 p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'}`}>
          <div className="flex justify-between mb-2">
            <h2 className="font-semibold">
              {selectedQuestion ?
                `${questions.find(q => q.id === selectedQuestion)?.title} (#${selectedQuestion})` :
                'Editor'}
            </h2>
            <div className="flex space-x-2">
              {/* Run button moved to Header */}
            </div>
          </div>

          {/* Question description (if selected) */}
          {selectedQuestion && (
            <div className={`mb-3 p-3 rounded-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
              <p>{questions.find(q => q.id === selectedQuestion)?.description}</p>
            </div>
          )}

          <textarea
            ref={editorRef}
            className={`w-full ${selectedQuestion ? 'h-3/4' : 'h-full'} p-2 font-mono text-sm resize-none rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-800'
              }`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleTab}
            spellCheck="false"
          />
        </div>

        {/* Terminal Section (Output + Input) */}
        <div className={`w-1/3 p-0 flex flex-col border-l-2 shadow-inner z-10 ${theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-white'}`}>
          <div className={`p-3 flex justify-between items-center border-b ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
            <h2 className="font-semibold text-sm uppercase tracking-wider opacity-80">Terminal</h2>
            <button
              onClick={clearOutput}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all transform hover:scale-105 ${theme === 'dark' ? 'bg-red-900/50 text-red-200 hover:bg-red-800 border border-red-800' : 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'}`}
              title="Clear Terminal Output"
            >
              🗑️ Clear
            </button>
          </div>

          <div className={`flex-1 flex flex-col p-4 font-mono text-sm overflow-hidden ${theme === 'dark' ? 'bg-[#0d1117] text-gray-300' : 'bg-white text-gray-900'}`}>
            {/* Output Area (Scrollable) with Input at bottom */}
            <div className="flex-1 overflow-auto mb-2 font-mono" id="terminal-output">
              {outputHistory.map((entry, index) => (
                <div key={index} className="mb-1">
                  {entry.type === 'command' && (
                    <div className="text-gray-500 text-xs mt-2 border-t border-gray-700 pt-1">$ {entry.content}</div>
                  )}
                  {entry.type === 'input' && (
                    <div className="flex">
                      <span className="mr-2 text-green-500 select-none">{'>'}</span>
                      <div className="text-white font-bold">{entry.content}</div>
                    </div>
                  )}
                  {entry.type === 'output' && (
                    <pre className="whitespace-pre-wrap leading-tight pl-2 border-l-2 border-gray-700 ml-1">{entry.content}</pre>
                  )}
                </div>
              ))}

              {error && <div className="text-red-500 mb-1">{error}</div>}

              {isRunning && (
                <div className="flex items-center text-yellow-500 mt-2">
                  <span className="animate-pulse mr-2">▶</span> Running...
                </div>
              )}

              {/* Integrated Input Line */}
              <div className={`flex items-start mt-2 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                <span className="mr-2 text-green-500 select-none animate-pulse">{'>'}</span>
                <textarea
                  className={`flex-1 bg-transparent resize-none outline-none font-mono ${theme === 'dark' ? 'text-white' : 'text-black'}`}
                  rows={1}
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      // Prevent newline in textarea
                      e.preventDefault();
                      runCode();
                    }
                    // Allow submitting with just Enter if desired, but user kept the Ctrl+Enter prompt text from before.
                    // Let's stick to Ctrl+Enter for safety or Enter?
                    // User said "Then click ENTER then ,it will give the output".
                    // Let's bind ENTER (without shift) to Run.
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      runCode();
                    }
                  }}
                  placeholder="Type input..."
                  spellCheck="false"
                  autoFocus
                />
              </div>

              {/* Auto scroll anchor */}
              <div style={{ float: "left", clear: "both" }}
                ref={(el) => { if (el) { el.scrollIntoView({ behavior: "smooth" }); } }}>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Solved Popup */}
      {showSolvedPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className={`relative p-6 rounded-lg shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} max-w-sm`}>
            <div className="text-center">
              <div className="mb-4 text-green-500 text-5xl">✓</div>
              <h3 className="text-xl font-bold mb-2">Challenge Completed!</h3>
              <p className="mb-4">You've successfully solved Challenge #{selectedQuestion}!</p>
              <button
                onClick={() => setShowSolvedPopup(false)}
                className={`px-4 py-2 rounded-md ${theme === 'dark'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-blue-500 hover:bg-blue-600'
                  } text-white`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineCode;