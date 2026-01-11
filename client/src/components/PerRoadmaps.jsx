import React, { useState } from 'react';
import axios from 'axios';
import API_URL from '../config/api';

// Gemini API key (replace this with environment variable in production)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const PersonalizedRoadmap = () => {
  const [topic, setTopic] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [priorKnowledge, setPriorKnowledge] = useState('beginner');
  const [depth, setDepth] = useState('overview');
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);

  const generateRoadmap = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!GEMINI_API_KEY) {
        throw new Error('AI features are not configured. Please set VITE_GEMINI_API_KEY in your environment.');
      }

      const prompt = `
        Create a personalized learning roadmap with the following parameters:
        
        Topic: ${topic}
        Time Limit: ${timeLimit}
        Prior Knowledge Level: ${priorKnowledge}
        Desired Depth: ${depth}
        
        Please format your response as follows:
        
        # LEARNING ROADMAP: ${topic.toUpperCase()}
        
        ## TECHNOLOGIES AND TOPICS
        (List all technologies and topics to learn with estimated time allocation for each)
        
        ## STEP-BY-STEP GUIDE
        (Provide a detailed timeline and sequence of learning activities to complete within the ${timeLimit} timeframe)
        
        ## ADDITIONAL RESOURCES AND RECOMMENDATIONS
        (Include any relevant information, tips, or resources that would be helpful)
      `;

      // Use backend proxy for AI
      const backendUrl = API_URL;
      const token = localStorage.getItem('token'); // Get token for auth

      const response = await axios.post(`${backendUrl}/api/ai/ask`, {
        context: 'ROADMAP_GEN',
        prompt: prompt
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data;
      const roadmapText = data.answer;

      if (!roadmapText) {
        throw new Error('No roadmap was generated');
      }

      setRoadmap(roadmapText);

      // Save to Database
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await axios.post(`${API_URL}/api/features/roadmap`, {
            roadmap: roadmapText,
            currentStep: 'generated',
            completedSteps: []
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } catch (saveError) {
        console.error("Failed to save roadmap:", saveError);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to generate roadmap');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 4) {
      generateRoadmap();
    } else {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const isStepComplete = () => {
    switch (step) {
      case 1:
        return topic.trim() !== '';
      case 2:
        return timeLimit.trim() !== '';
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const processMarkdownLine = (line, index) => {
    if (line.startsWith('# ')) {
      return <h1 key={index} className="text-3xl font-extrabold mt-8 mb-6 text-purple-800">{line.substring(2)}</h1>;
    } else if (line.startsWith('## ')) {
      return <h2 key={index} className="text-2xl font-bold mt-6 mb-4 text-indigo-700 border-b pb-2">{line.substring(3)}</h2>;
    } else if (line.startsWith('### ')) {
      return <h3 key={index} className="text-xl font-bold mt-5 mb-3 text-blue-600">{line.substring(4)}</h3>;
    } else if (line.trim() === '') {
      return <br key={index} />;
    } else if (line.trim().startsWith('* ')) {
      const content = line.trim().substring(2);
      return (
        <div key={index} className="flex mb-2">
          <div className="mr-2 text-indigo-600">•</div>
          <div className="text-gray-700">{processInlineFormatting(content)}</div>
        </div>
      );
    } else {
      return <p key={index} className="mb-3 text-gray-700">{processInlineFormatting(line)}</p>;
    }
  };

  const processInlineFormatting = (text) => {
    const parts = [];
    let currentIndex = 0;
    let boldRegex = /\*\*(.*?)\*\*/g;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > currentIndex) {
        parts.push({
          text: text.substring(currentIndex, match.index),
          bold: false
        });
      }

      parts.push({
        text: match[1],
        bold: true
      });

      currentIndex = match.index + match[0].length;
    }

    if (currentIndex < text.length) {
      parts.push({
        text: text.substring(currentIndex),
        bold: false
      });
    }

    if (parts.length === 0) {
      return text;
    }

    return parts.map((part, i) =>
      part.bold ?
        <span key={i} className="font-bold text-indigo-800">{part.text}</span> :
        <span key={i}>{part.text}</span>
    );
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([roadmap], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${topic}-learning-roadmap.txt`;
    document.body.appendChild(element);
    element.click();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && isStepComplete()) {
      nextStep();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-purple-800">Step 1: Choose Your Topic</h2>
            <div className="mb-6">
              <label className="block text-lg font-medium mb-2 text-purple-900">
                What topic do you want to learn?
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="mt-3 block w-full rounded-lg border-purple-300 shadow-sm p-3 border focus:border-purple-500 focus:ring focus:ring-purple-200"
                  placeholder="e.g., React, Machine Learning, Web Development"
                />
              </label>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="bg-gradient-to-r from-blue-100 to-green-100 p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-blue-800">Step 2: Set Your Timeline</h2>
            <div className="mb-6">
              <label className="block text-lg font-medium mb-2 text-blue-900">
                What is your time limit?
                <input
                  type="text"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="mt-3 block w-full rounded-lg border-blue-300 shadow-sm p-3 border focus:border-blue-500 focus:ring focus:ring-blue-200"
                  placeholder="e.g., 2 weeks, 3 months, 1 year"
                />
              </label>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="bg-gradient-to-r from-green-100 to-yellow-100 p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-green-800">Step 3: Your Experience Level</h2>
            <div className="mb-6">
              <label className="block text-lg font-medium mb-2 text-green-900">
                How much prior knowledge do you have?
                <select
                  value={priorKnowledge}
                  onChange={(e) => setPriorKnowledge(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="mt-3 block w-full rounded-lg border-green-300 shadow-sm p-3 border focus:border-green-500 focus:ring focus:ring-green-200"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="bg-gradient-to-r from-yellow-100 to-red-100 p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-yellow-800">Step 4: Learning Depth</h2>
            <div className="mb-6">
              <label className="block text-lg font-medium mb-2 text-yellow-900">
                How much depth do you want to cover?
                <select
                  value={depth}
                  onChange={(e) => setDepth(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="mt-3 block w-full rounded-lg border-yellow-300 shadow-sm p-3 border focus:border-yellow-500 focus:ring focus:ring-yellow-200"
                >
                  <option value="overview">Overview (from the top)</option>
                  <option value="moderate">Moderate depth</option>
                  <option value="in-depth">In-depth understanding</option>
                </select>
              </label>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-100 py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
            AI Personalized Roadmap Generator
          </h1>
          <p className="text-lg text-indigo-700">Create your perfect learning path in minutes</p>
        </div>

        {!roadmap && (
          <div className="mb-8">
            <div className="flex justify-between mb-1">
              {[1, 2, 3, 4].map((num) => (
                <div
                  key={num}
                  className={`flex flex-col items-center ${step >= num ? 'text-indigo-600' : 'text-gray-400'}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${step > num
                      ? 'bg-indigo-600 text-white'
                      : step === num
                        ? 'bg-white border-2 border-indigo-600 text-indigo-600'
                        : 'bg-gray-200 text-gray-500'
                      }`}
                  >
                    {num}
                  </div>
                  <span className="text-xs">{
                    num === 1 ? "Topic" :
                      num === 2 ? "Time" :
                        num === 3 ? "Level" :
                          "Depth"
                  }</span>
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${(step - 1) * 33.3}%` }}
              ></div>
            </div>
          </div>
        )}

        {!roadmap && renderStep()}

        {!roadmap && (
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={prevStep}
                className="px-6 py-3 bg-white text-indigo-600 font-medium rounded-lg shadow hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            ) : (
              <div></div>
            )}

            <button
              onClick={nextStep}
              disabled={!isStepComplete() || (step === 4 && loading)}
              className={`px-6 py-3 rounded-lg shadow font-medium text-white transition-colors ${isStepComplete()
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                : 'bg-gray-400 cursor-not-allowed'
                }`}
            >
              {step === 4
                ? (loading ? 'Generating...' : 'Generate Roadmap')
                : 'Next'}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-8 p-6 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p>{error}</p>
          </div>
        )}

        {roadmap && (
          <div className="mt-8">
            <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-indigo-600">
              <h2 className="text-3xl font-bold mb-6 text-indigo-800 text-center">Your Personalized Roadmap</h2>
              <div className="prose max-w-none pl-2 overflow-auto" style={{ maxHeight: '500px' }}>
                {roadmap.split('\n').map((line, index) => processMarkdownLine(line, index))}
              </div>

              <div className="mt-8 flex justify-center space-x-6">
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-medium rounded-lg shadow hover:from-green-700 hover:to-blue-700 transition-colors"
                >
                  Download Roadmap
                </button>
                <button
                  onClick={() => {
                    setRoadmap(null);
                    setStep(1);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg shadow hover:from-indigo-700 hover:to-purple-700 transition-colors"
                >
                  Create Another Roadmap
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalizedRoadmap;
