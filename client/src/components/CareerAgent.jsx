import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';

// Replace with your actual API key
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the Gemini API
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.0-flash" }) : null;

function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [currentResponse, setCurrentResponse] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(false);

  const questions = [
    "What aspects of technology excite you the most? (e.g., creating visual designs, solving complex problems, working with data, etc.)",
    "Do you prefer working on what users directly interact with or the behind-the-scenes systems that power applications?",
    "How do you feel about continuous learning and adapting to new technologies?",
    "Do you enjoy working more independently or collaboratively in a team?",
    "What kind of projects have you enjoyed working on in the past, even if they weren't technical?"
  ];

  const handleNext = async () => {
    if (!currentResponse.trim()) {
      alert("Please provide an answer before continuing.");
      return;
    }

    const updatedResponses = { ...responses, [currentStep]: currentResponse };
    setResponses(updatedResponses);
    setCurrentResponse('');

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Process final recommendation
      setLoading(true);
      await generateRecommendation(updatedResponses);
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleNext();
    }
  };

  const formatResponseToRemoveMarkdown = (text) => {
    // Replace markdown list markers with proper HTML formatting
    return text
      .replace(/\*\*\*/g, '<span class="font-bold italic">')
      .replace(/\*\*/g, '<span class="font-bold">')
      .replace(/\*/g, '• ')
      .replace(/<\/span><\/span>/g, '</span>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br />');
  };

  const generateRecommendation = async (allResponses) => {
    try {
      if (!model) {
        setRecommendation("AI features are not configured. Please set VITE_GEMINI_API_KEY in your environment.");
        return;
      }

      const prompt = `
        Based on a user's responses to questions about their technology interests, recommend a specific tech career path (frontend, backend, data science, blockchain, etc.) that would suit them best.
        
        Here are their responses:
        
        Question 1: ${questions[0]}
        Response: ${allResponses[0]}
        
        Question 2: ${questions[1]}
        Response: ${allResponses[1]}
        
        Question 3: ${questions[2]}
        Response: ${allResponses[2]}
        
        Question 4: ${questions[3]}
        Response: ${allResponses[3]}
        
        Question 5: ${questions[4]}
        Response: ${allResponses[4]}
        
        Provide a detailed explanation (about 300 words) about why this career path is suitable for them based on their answers. Include specific skills they should develop, potential job roles they might enjoy, and learning resources they could explore. Make the recommendation personalized and constructive.
        
        Use Markdown for formatting:
        - Use ## for main headings (e.g. ## Why Backend?)
        - Use **bold** for emphasis
        - Use bullet points for lists
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      setRecommendation(text);
    } catch (error) {
      console.error("Error generating recommendation:", error);
      setRecommendation("Sorry, there was an error generating your recommendation. Please try again later.");
    }
  };

  const handleStartOver = () => {
    setCurrentStep(0);
    setResponses({});
    setCurrentResponse('');
    setRecommendation('');
  };

  const renderRecommendation = () => {
    return (
      <div className="prose prose-indigo max-w-none">
        <ReactMarkdown>{recommendation}</ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center text-indigo-700 mb-8">Tech Career Path Finder</h1>

        {!recommendation ? (
          <>
            <div className="mb-8">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span className="font-medium">Question {currentStep + 1} of {questions.length}</span>
                <span>{Math.round((currentStep / questions.length) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${(currentStep / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-medium text-gray-800 mb-4">{questions[currentStep]}</h2>
              <textarea
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-32 shadow-sm"
                placeholder="Type your answer here... Press Ctrl+Enter to continue"
              />
              <div className="text-xs text-gray-500 mt-2 text-right">Press Ctrl+Enter to continue</div>
            </div>

            <div className="flex justify-between">
              {currentStep > 0 && (
                <button
                  onClick={() => {
                    setCurrentStep(currentStep - 1);
                    setCurrentResponse(responses[currentStep - 1] || '');
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors duration-300"
                >
                  Back
                </button>
              )}
              <div className={currentStep > 0 ? '' : 'ml-auto'}>
                <button
                  onClick={handleNext}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-300 shadow-md flex items-center"
                >
                  {currentStep < questions.length - 1 ? (
                    <>Next<span className="ml-2">→</span></>
                  ) : (
                    <>Get Recommendation</>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="recommendation-section">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-6 text-gray-600 font-medium">Analyzing your responses...</p>
              </div>
            ) : (
              <>
                <div className="bg-indigo-100 p-1 rounded-lg mb-8">
                  <div className="bg-white p-6 rounded-lg border-l-4 border-indigo-600">
                    <h2 className="text-2xl font-bold text-indigo-800 mb-4">Your Career Recommendation</h2>
                    <div className="text-gray-800 leading-relaxed">
                      {renderRecommendation()}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={handleStartOver}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors duration-300"
                  >
                    Start Over
                  </button>
                  <button
                    onClick={() => {
                      // Here you would implement sharing or saving functionality
                      alert("This would save or share your recommendation!");
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-300 shadow-md flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Save Result
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;