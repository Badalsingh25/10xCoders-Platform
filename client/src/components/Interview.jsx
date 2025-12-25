import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const QUESTION_TIME = 120; // seconds per question

const InterviewPrep = () => {
  const [stage, setStage] = useState('job-input');
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [questionCount, setQuestionCount] = useState(5);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [aiEvaluation, setAiEvaluation] = useState('');
  const [overallFeedback, setOverallFeedback] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [scores, setScores] = useState([]);
  const [hints, setHints] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef(null);
  const [recognition, setRecognition] = useState(null);
  const [speechError, setSpeechError] = useState('');
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);

  const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

  const topicOptions = [
    'Core CS Fundamentals',
    'Data Structures & Algorithms',
    'Frontend (React / JavaScript)',
    'Backend (Node.js / Databases)',
    'System Design',
    'Behavioral / HR'
  ];

  const difficultyOptions = ['Beginner', 'Intermediate', 'Advanced'];

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognitionInstance = new window.webkitSpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const interimTranscript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        
        setUserAnswer(interimTranscript);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        // Handle common non-fatal errors more gracefully
        if (event.error === 'no-speech') {
          setSpeechError('No speech was detected. Please check your microphone and try again.');
        } else if (event.error === 'audio-capture') {
          setSpeechError('Cannot access microphone. Please allow microphone permissions in your browser settings and try again.');
        } else if (event.error === 'not-allowed') {
          setSpeechError('Microphone access is blocked. Please enable it in your browser and reload the page.');
        } else {
          setSpeechError(`Speech recognition error: ${event.error}`);
          alert(`Speech recognition error: ${event.error}`);
        }
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    } else {
      console.error('Speech recognition not supported');
      alert('Speech recognition is not supported in this browser.');
    }
  }, []);

  const generateInterviewQuestions = async () => {
    setIsLoading(true);
    try {
      if (!genAI) {
        alert("AI features are not configured. Please set VITE_GEMINI_API_KEY in your environment.");
        return;
      }

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const selectedTopic = topic || 'general interview preparation';
      const selectedDifficulty = difficulty || 'mixed beginner to intermediate';

      const prompt = `Generate ${questionCount} interview questions for a ${jobRole} position.

Topic focus: ${selectedTopic}
Difficulty level: ${selectedDifficulty}

Use the following job description as context:
${jobDescription}

For each question, provide:
1. A clear, specific question that tests relevant technical and soft skills
2. Make sure the question matches the topic focus and difficulty level
3. Include a mix of behavioral, technical, and situational questions
4. Ensure questions are professional and job-specific

Format the output as a JSON array of question objects, where each object has exactly one property: "question" (a string with the question text). Do not include any other text before or after the JSON.`;

      const result = await model.generateContent(prompt);
      const response = await result.response.text();
    
      const jsonMatch = response.match(/\[.*\]/s);
      if (jsonMatch) {
        try {
          const questions = JSON.parse(jsonMatch[0]);
          setGeneratedQuestions(questions);
          setCurrentQuestionIndex(0);
          setUserAnswers([]);
          setScores([]);
          setHints([]);
          setUserAnswer('');
          setAiEvaluation('');
          setStage('interview');
        } catch (parseError) {
          console.error("Failed to parse questions:", parseError);
          alert("Failed to generate questions. Please try again.");
        }
      } else {
        console.error("No JSON found in response");
        alert("Failed to generate questions. Please try again.");
      }
    } catch (error) {
      console.error("Question Generation Error:", error);
      alert("Failed to generate questions. Please check your API key and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFeedbackPdf = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 11;
      const lineHeight = 14;
      const margin = 40;
      let y = height - margin;

      const drawWrappedText = (text) => {
        const maxWidth = width - margin * 2;
        const paragraphs = text.split('\n');
        paragraphs.forEach((para) => {
          const words = para.split(' ');
          let line = '';
          words.forEach((word) => {
            const testLine = line ? `${line} ${word}` : word;
            const textWidth = font.widthOfTextAtSize(testLine, fontSize);
            if (textWidth > maxWidth) {
              page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
              y -= lineHeight;
              line = word;
            } else {
              line = testLine;
            }
          });
          if (line) {
            page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
            y -= lineHeight;
          }
          y -= lineHeight / 2;
        });
      };

      page.drawText('Interview Feedback Report', {
        x: margin,
        y,
        size: 16,
        font,
        color: rgb(0.35, 0.16, 0.56),
      });
      y -= 24;

      drawWrappedText(`Role: ${jobRole}`);
      if (topic) {
        drawWrappedText(`Topic: ${topic}`);
      }
      if (difficulty) {
        drawWrappedText(`Difficulty: ${difficulty}`);
      }
      drawWrappedText(`Number of questions: ${questionCount}`);
      y -= lineHeight;

      const averageScore = getAverageScore();
      if (averageScore !== null) {
        drawWrappedText(`Average score: ${averageScore.toFixed(1)} / 10`);
        y -= lineHeight;
      }

      generatedQuestions.forEach((q, index) => {
        y -= lineHeight / 2;
        drawWrappedText(`Question ${index + 1}: ${q.question}`);
        const answerText = index === currentQuestionIndex
          ? (userAnswer || userAnswers[index] || 'No answer provided')
          : (userAnswers[index] || 'No answer provided');
        drawWrappedText(`Your Answer: ${answerText}`);
        if (typeof scores[index] === 'number') {
          drawWrappedText(`Score: ${scores[index]} / 10`);
        }
        y -= lineHeight / 2;
      });

      y -= lineHeight;
      drawWrappedText('Overall Feedback:');
      drawWrappedText(overallFeedback.replace(/\*/g, ''));

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'interview-feedback.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const currentScore = scores[currentQuestionIndex] ?? null;
  const currentHint = hints[currentQuestionIndex] || '';

  const getAverageScore = () => {
    const validScores = scores.filter((s) => typeof s === 'number');
    if (!validScores.length) return null;
    const total = validScores.reduce((sum, value) => sum + value, 0);
    return total / validScores.length;
  };

  const generateHintForCurrentQuestion = async () => {
    if (!generatedQuestions[currentQuestionIndex]) return;

    setIsHintLoading(true);
    try {
      if (!genAI) {
        alert("AI features are not configured. Please set VITE_GEMINI_API_KEY in your environment.");
        return;
      }

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const currentQuestion = generatedQuestions[currentQuestionIndex].question;
      const selectedTopic = topic || 'general interview preparation';
      const selectedDifficulty = difficulty || 'mixed beginner to intermediate';

      const prompt = `You are helping a candidate prepare for a ${jobRole} interview.

Topic focus: ${selectedTopic}
Difficulty level: ${selectedDifficulty}

Question: "${currentQuestion}"

Provide:
1. A very short 1-2 line hint that nudges the candidate in the right direction without giving the full answer.
2. 3-5 bullet points that describe an ideal answer.

Format your response with bold headings (e.g., **Hint:** and **Ideal Answer:**). Avoid using * characters except for these bold markers.`;

      const result = await model.generateContent(prompt);
      const response = await result.response.text();

      setHints(prev => {
        const updated = [...prev];
        updated[currentQuestionIndex] = response;
        return updated;
      });
      setShowHint(true);
    } catch (error) {
      console.error("Hint Generation Error:", error);
      alert("Failed to generate a hint. Please try again.");
    } finally {
      setIsHintLoading(false);
    }
  };

  const handleHintClick = async () => {
    if (currentHint) {
      setShowHint(prev => !prev);
      return;
    }
    await generateHintForCurrentQuestion();
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      videoRef.current.srcObject = stream;
    } catch (error) {
      console.error("Webcam access error:", error);
      alert("Unable to access webcam. Please check permissions.");
    }
  };

  const startRecording = () => {
    if (recognition) {
      recognition.start();
      setIsRecording(true);
    } else {
      alert("Speech recognition is not supported in this browser.");
    }
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  const evaluateAnswer = async () => {
    setIsLoading(true);
    try {
      if (!genAI) {
        setAiEvaluation("AI features are not configured. Please set VITE_GEMINI_API_KEY in your environment.");
        return;
      }

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const currentQuestion = generatedQuestions[currentQuestionIndex].question;
      
      const prompt = `Evaluate this answer to the interview question: "${currentQuestion}"

Answer: "${userAnswer}"

Please provide a comprehensive evaluation with:
1. Relevance Score (0-10)
2. Proper correct answer
3. Keep the answer short (50-60 words)
4. Suggested Improvements

Format your response in a clear, constructive manner that helps the interviewee understand their performance. Use bold text for headings (e.g., **Key Strengths Demonstrated:**) and ensure the response is well-formatted in points. Do not use * marks.`;

      const result = await model.generateContent(prompt);
      const response = await result.response.text();

      // Persist the current answer for this question
      setUserAnswers(prev => {
        const updated = [...prev];
        updated[currentQuestionIndex] = userAnswer;
        return updated;
      });

      // Try to parse a numeric relevance score (0-10) from the AI response
      let parsedScore = null;
      const scoreMatch = response.match(/Relevance Score[^0-9]*([0-9]{1,2})/i);
      if (scoreMatch) {
        const numericScore = parseInt(scoreMatch[1], 10);
        if (!Number.isNaN(numericScore)) {
          parsedScore = Math.max(0, Math.min(10, numericScore));
        }
      }

      if (parsedScore !== null) {
        setScores(prev => {
          const updated = [...prev];
          updated[currentQuestionIndex] = parsedScore;
          return updated;
        });
      }
      setAiEvaluation(response);
    } catch (error) {
      console.error("AI Evaluation Error:", error);
      setAiEvaluation("Evaluation failed. Please try again or check your internet connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateOverallFeedback = async () => {
    setIsLoading(true);
    try {
      if (!genAI) {
        alert("AI features are not configured. Please set VITE_GEMINI_API_KEY in your environment.");
        return;
      }

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const averageScore = getAverageScore();
      const averageScoreText = averageScore !== null ? averageScore.toFixed(1) : 'N/A';
      const scoreLines = generatedQuestions.map((q, index) => 
        `Question ${index + 1} score: ${typeof scores[index] === 'number' ? scores[index] : 'N/A'}`
      ).join('\n');

      const qaSection = generatedQuestions.map((q, index) => {
        const answerText = index === currentQuestionIndex
          ? (userAnswer || userAnswers[index] || 'No answer provided')
          : (userAnswers[index] || 'No answer provided');
        return `Question ${index + 1}: ${q.question}\nAnswer: ${answerText}`;
      }).join('\n\n');

      const prompt = `Provide an overall evaluation of the interview performance for a ${jobRole} position.

Questions and Answers:
${qaSection}

Scores (0-10):
Average score: ${averageScoreText}
${scoreLines}

Please provide:
1. A concise overall performance summary
2. Key strengths demonstrated
3. Areas for improvement
4. Overall recommendation

Format the response with bold headings (e.g., **Key Strengths Demonstrated:**) and ensure it is well-formatted in points. Do not use * marks.`;

      const result = await model.generateContent(prompt);
      const response = await result.response.text();
      setOverallFeedback(response);
      setStage('overall-feedback');
    } catch (error) {
      console.error("Overall Feedback Generation Error:", error);
      alert("Failed to generate overall feedback. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (stage === 'interview') {
      startWebcam();
    }
  }, [stage]);

  useEffect(() => {
    if (stage === 'interview') {
      setTimeLeft(QUESTION_TIME);
      setSpeechError('');
      setShowHint(false);
    }
  }, [stage, currentQuestionIndex]);

  useEffect(() => {
    if (stage !== 'interview') return;

    if (timeLeft <= 0) {
      if (isRecording && recognition) {
        recognition.stop();
        setIsRecording(false);
      }
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [stage, timeLeft, isRecording, recognition]);

  const renderJobInput = () => (
    <div className="bg-white min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-purple-600 mb-8">Custom Interview Preparation</h1>
      
      <div className="w-full max-w-2xl bg-purple-50 p-8 rounded-lg shadow-2xl">
        <div className="mb-4">
          <label className="block text-purple-800 mb-2 font-semibold">Job Role</label>
          <input 
            type="text" 
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            placeholder="e.g., Software Engineer, Data Scientist"
            className="w-full p-3 rounded-lg border-2 border-purple-300 focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="mb-6">
          <label className="block text-purple-800 mb-2 font-semibold">Topic</label>
          <div className="flex flex-wrap gap-2">
            {topicOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTopic(option)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  topic === option
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-purple-800 mb-2 font-semibold">Difficulty</label>
          <div className="flex flex-wrap gap-2">
            {difficultyOptions.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setDifficulty(level)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  difficulty === level
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-purple-800 mb-2 font-semibold">Job Description</label>
          <textarea 
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            rows="6"
            className="w-full p-3 rounded-lg border-2 border-purple-300 focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="mb-6">
          <label className="block text-purple-800 mb-2 font-semibold">Number of Questions</label>
          <div className="flex space-x-4">
            {[5, 10, 15, 20].map(count => (
              <button 
                key={count}
                onClick={() => setQuestionCount(count)}
                className={`px-4 py-2 rounded-full transition-all ${
                  questionCount === count 
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                }`}
              >
                {count} Questions
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={generateInterviewQuestions}
          disabled={!jobRole || !jobDescription || isLoading}
          className="w-full bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Questions...
            </span>
          ) : (
            'Generate Interview Questions'
          )}
        </button>
      </div>
    </div>
  );

  const renderInterviewStage = () => (
    <div className="bg-white min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-6xl grid grid-cols-12 gap-8">

        <div className="col-span-6 bg-purple-100 rounded-lg overflow-hidden h-[600px] shadow-xl">
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="col-span-6 bg-purple-50 rounded-lg p-6 flex flex-col shadow-xl">
          <h2 className="text-2xl font-bold mb-2 text-purple-800">
            {jobRole} Interview
          </h2>

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-purple-700">
              Question {currentQuestionIndex + 1} of {questionCount}
            </span>
            <span className="text-sm font-mono text-purple-700">
              Time left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <div className="w-full h-2 bg-purple-100 rounded-full mb-4">
            <div
              className="h-2 bg-purple-500 rounded-full"
              style={{ width: `${((currentQuestionIndex + 1) / questionCount) * 100}%` }}
            />
          </div>

          <div className="mb-6 flex-grow">
            <p className="text-lg text-purple-900">
              {generatedQuestions[currentQuestionIndex].question}
            </p>
          </div>

          <div className="flex items-center justify-end mb-4">
            <button
              type="button"
              onClick={handleHintClick}
              disabled={isHintLoading}
              className="text-sm text-purple-700 hover:text-purple-900 underline disabled:opacity-50"
            >
              {isHintLoading
                ? 'Loading hint...'
                : currentHint
                  ? (showHint ? 'Hide Hint / Model Answer' : 'Show Hint / Model Answer')
                  : 'Get Hint / Model Answer'}
            </button>
          </div>

          {showHint && currentHint && (
            <div className="bg-purple-100 p-4 rounded-lg mb-4">
              <h3 className="font-bold mb-2 text-purple-800">Hint / Model Answer:</h3>
              <div className="text-purple-900 whitespace-pre-line text-sm">
                {currentHint.split('\n').map((line, index) => {
                  if (line.startsWith('**')) {
                    return <p key={index} className="font-bold">{line.replace(/\*\*/g, '')}</p>;
                  }
                  return <p key={index}>{line.replace(/\*/g, '•')}</p>;
                })}
              </div>
            </div>
          )}

          <div className="flex space-x-4 mb-6">
            <button 
              onClick={startRecording}
              disabled={isRecording}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {isRecording ? 'Recording...' : 'Start Recording'}
            </button>
            <button 
              onClick={stopRecording}
              disabled={!isRecording}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              Stop Recording
            </button>
          </div>

          {speechError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {speechError}
            </div>
          )}

          <div className="bg-purple-100 p-4 rounded-lg mb-4">
            <h3 className="font-bold mb-2 text-purple-800">Your Answer:</h3>
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              rows="4"
              className="w-full p-3 rounded-lg border-2 border-purple-300 focus:border-purple-500 transition-colors text-sm text-purple-900 bg-white"
              placeholder="You can speak or type your answer here before evaluating."
            />
            <p className="text-xs text-purple-700 mt-1">
              You can edit this text if speech recognition did not capture your answer correctly.
            </p>
          </div>

          {aiEvaluation && (
            <div className="bg-purple-100 p-4 rounded-lg mb-4">
              <h3 className="font-bold mb-2 text-purple-800">AI Evaluation:</h3>
              {currentScore !== null && (
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-purple-800">
                    Score: {currentScore}/10
                  </span>
                  <div className="w-32 h-2 bg-purple-200 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-purple-600 rounded-full"
                      style={{ width: `${(currentScore / 10) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="text-purple-900 whitespace-pre-line">
                {aiEvaluation.split('\n').map((line, index) => {
                  if (line.startsWith('**')) {
                    return <p key={index} className="font-bold">{line.replace(/\*\*/g, '')}</p>;
                  }
                  return <p key={index}>{line.replace(/\*/g, '•')}</p>;
                })}
              </div>
            </div>
          )}

          <div className="flex justify-between mt-auto gap-2">
            <button 
              onClick={evaluateAnswer}
              disabled={isLoading}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Evaluating...
                </span>
              ) : (
                'Evaluate Answer'
              )}
            </button>
            
            {currentQuestionIndex > 0 && (
              <button 
                onClick={() => {
                  setUserAnswers(prev => {
                    const updated = [...prev];
                    updated[currentQuestionIndex] = userAnswer;
                    return updated;
                  });
                  const previousIndex = currentQuestionIndex - 1;
                  setCurrentQuestionIndex(previousIndex);
                  setUserAnswer(userAnswers[previousIndex] || '');
                  setAiEvaluation('');
                  setShowHint(false);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Previous Question
              </button>
            )}

            {currentQuestionIndex < questionCount - 1 ? (
              <button 
                onClick={() => {
                  setUserAnswers(prev => {
                    const updated = [...prev];
                    updated[currentQuestionIndex] = userAnswer;
                    return updated;
                  });
                  const nextIndex = currentQuestionIndex + 1;
                  setCurrentQuestionIndex(nextIndex);
                  setUserAnswer(userAnswers[nextIndex] || '');
                  setAiEvaluation('');
                  setShowHint(false);
                }}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Next Question
              </button>
            ) : (
              <button 
                onClick={generateOverallFeedback}
                disabled={isLoading}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Feedback...
                  </span>
                ) : (
                  'Generate Overall Feedback'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderOverallFeedback = () => (
    <div className="bg-white min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-purple-600 mb-8">Interview Feedback</h1>
      
      <div className="w-full max-w-2xl bg-purple-50 p-8 rounded-lg shadow-2xl">
        <h2 className="text-2xl font-bold mb-4 text-purple-800">Overall Feedback</h2>

        {(() => {
          const averageScore = getAverageScore();
          if (averageScore === null) return null;

          const rounded = averageScore.toFixed(1);
          let badgeText = '';
          let badgeColor = '';

          if (averageScore >= 7.5) {
            badgeText = 'Great! You are ready for real interviews.';
            badgeColor = 'bg-green-100 text-green-800';
          } else if (averageScore >= 5) {
            badgeText = 'Passable performance – keep practicing.';
            badgeColor = 'bg-yellow-100 text-yellow-800';
          } else {
            badgeText = 'Practice more before real interviews.';
            badgeColor = 'bg-red-100 text-red-800';
          }

          return (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-purple-800">Average Score</span>
                <span className="text-sm font-mono text-purple-800">{rounded}/10</span>
              </div>
              <div className="w-full h-2 bg-purple-100 rounded-full mb-3 overflow-hidden">
                <div
                  className="h-2 bg-purple-500 rounded-full"
                  style={{ width: `${(averageScore / 10) * 100}%` }}
                />
              </div>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}`}>
                {badgeText}
              </div>
            </div>
          );
        })()}

        <div className="bg-purple-100 p-4 rounded-lg">
          <div className="text-purple-900 whitespace-pre-line">
            {overallFeedback.split('\n').map((line, index) => {
              if (line.startsWith('**')) {
                return <p key={index} className="font-bold">{line.replace(/\*\*/g, '')}</p>;
              }
              return <p key={index}>{line.replace(/\*/g, '•')}</p>;
            })}
          </div>
        </div>

        <button 
          onClick={downloadFeedbackPdf}
          className="w-full bg-purple-500 text-white p-3 rounded-lg hover:bg-purple-600 mt-6 transition-colors"
        >
          Download Feedback as PDF
        </button>

        <button 
          onClick={() => setStage('job-input')}
          className="w-full bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 mt-6 transition-colors"
        >
          Go to Home
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {stage === 'job-input' && renderJobInput()}
      {stage === 'interview' && renderInterviewStage()}
      {stage === 'overall-feedback' && renderOverallFeedback()}
    </div>
  );
};

export default InterviewPrep;