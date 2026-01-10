import React, { useState, useRef } from 'react';
import { Upload, FileText, Send, Briefcase, CheckCircle, Volume2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import * as pdfjsLib from 'pdfjs-dist';
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

// Helper to clean AI output (remove code fences if present)
const cleanMarkdown = (text) => {
  if (!text) return "";
  // Removes ```markdown at start, and ``` at end, and trims whitespace
  return text.replace(/^```(markdown)?/i, "").replace(/```$/, "").trim();
};

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const extractTextFromPDF = async (pdfBuffer) => {
  try {
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    // Iterate through each page
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Extract text items and join them
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n\n';
    }

    if (!fullText.trim()) {
      throw new Error("No text found in PDF (it might be an image scan).");
    }

    console.log("Extracted PDF Text Preview:", fullText.substring(0, 200));
    return fullText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from the PDF. Please ensure it is a text-based PDF.");
  }
};

const EnhanceResume = () => {
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [step, setStep] = useState(1);
  const [selectedAction, setSelectedAction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [isReading, setIsReading] = useState(false);
  const fileInputRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  const actions = [
    { id: 'ats-score', label: 'Get ATS Score', description: 'Calculate how well your resume might perform in ATS systems' },
    { id: 'ats-enhancer', label: 'ATS Enhancer', description: 'Get specific suggestions to make your resume more ATS-friendly' },
    { id: 'resume-feedback', label: 'Resume Feedback', description: 'Receive detailed feedback on each section of your resume' },
    { id: 'keyword-match', label: 'Match Keywords', description: 'See how your resume keywords match with the job description' }
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      const reader = new FileReader();

      reader.onload = async (event) => {
        setFileContent(event.target.result);
      };

      reader.readAsArrayBuffer(selectedFile);
    } else {
      alert('Please select a PDF file');
    }
  };

  const handleActionSelect = (actionId) => {
    setSelectedAction(actionId);
  };

  const extractBasicInfo = (pdfText) => {
    const nameMatch = pdfText.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/m) ||
      pdfText.match(/([A-Z][a-z]+ [A-Z][a-z]+)\n/);
    const name = nameMatch ? nameMatch[1] : "professional";

    const jobTitleMatch = pdfText.match(/\n((?:Senior|Junior|Lead)?\s?[A-Za-z]+ (?:Developer|Engineer|Designer|Manager|Specialist|Analyst|Consultant))/m);
    const jobTitle = jobTitleMatch ? jobTitleMatch[1] : "";

    const yearsExpMatch = pdfText.match(/([0-9]+)\+?\s?years of experience/i);
    const yearsExperience = yearsExpMatch ? yearsExpMatch[1] : "";

    return {
      name,
      jobTitle,
      yearsExperience
    };
  };

  const processWithGemini = async () => {
    setIsLoading(true);

    try {
      if (!GEMINI_API_KEY) {
        setResult('AI features are not configured. Please set VITE_GEMINI_API_KEY in your environment.');
        return;
      }

      const pdfText = await extractTextFromPDF(fileContent);
      const basicInfo = extractBasicInfo(pdfText);

      let promptText = '';

      if (selectedAction === 'ats-score') {
        promptText = `I need analysis for a resume based on a job description.
        
        ACTION: ATS Score
        
        RESUME CONTENT:
        ${pdfText}
        
        JOB DESCRIPTION:
        ${jobDescription}
        
        Provide a detailed ATS compatibility score analysis in markdown format.
        Include a score out of 100 with breakdowns for different aspects like keyword matching, 
        format compatibility, section organization, and overall readability.
        Do not include any other analysis besides the ATS score.`;
      } else if (selectedAction === 'ats-enhancer') {
        promptText = `I need personalized analysis for ${basicInfo.name}'s resume based on a job description.
        
        RESUME CONTENT:
        ${pdfText}
        
        JOB DESCRIPTION:
        ${jobDescription}
        
        First, provide a personalized greeting that includes the person's name (${basicInfo.name}) and a brief
        summary of what you've understood about them from their resume (e.g., their experience level, current role,
        industry, key strengths, etc.).
        
        Then, provide an ATS compatibility score out of 100 with a brief breakdown.
        
        Next, provide specific recommendations to enhance the resume's ATS compatibility. Include:
        1. Format improvements to make the resume more ATS-friendly
        2. Content enhancements including missing keywords from the job description, personalized to their background
        3. Section-by-section recommendations that reference their specific experiences and skills
        
        Throughout your analysis, refer to them by name and make connections between their background and the job requirements.
        
        Present your analysis in markdown format.`;
      } else if (selectedAction === 'resume-feedback') {
        promptText = `I need personalized feedback for ${basicInfo.name}'s resume based on a job description.
        
        RESUME CONTENT:
        ${pdfText}
        
        JOB DESCRIPTION:
        ${jobDescription}
        
        First, provide a personalized greeting that includes the person's name (${basicInfo.name}) and a brief
        summary of what you've understood about them from their resume (their background, experience level, 
        key skills, career trajectory, etc.).
        
        Then, provide an ATS compatibility score out of 100 with a brief breakdown.
        
        Next, provide detailed section-by-section feedback on the resume. For each section (Contact Information, 
        Professional Summary, Work Experience, Skills, Education, etc.), include strengths (marked with ✅) 
        and improvement areas (marked with ⚠️). Make this feedback specific to their actual experiences and skills,
        not generic advice.
        
        Throughout your analysis, refer to them by name and make specific references to their background, using details
        from their resume to personalize the feedback.
        
        Present your analysis in markdown format.`;
      } else if (selectedAction === 'keyword-match') {
        promptText = `I need analysis for a resume based on a job description.
        
        RESUME CONTENT:
        ${pdfText}
        
        JOB DESCRIPTION:
        ${jobDescription}
        
        First, provide an ATS compatibility score out of 100 with a brief breakdown.
        
        Then, analyze how well the resume's keywords match with the job description. Include:
        1. A table showing key terms from the job description and whether they appear in the resume
        2. Missing keywords that should be added
        3. Recommendations for keyword placement
        4. Overall keyword match score as a percentage
        
        Present your analysis in markdown format.
        Do not include any other analysis besides the ATS score and keyword matching analysis.`;
      }

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: promptText
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      const data = await response.json();

      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        setResult(data.candidates[0].content.parts[0].text);
      } else {
        throw new Error('Invalid response from Gemini API');
      }

      setStep(4);
    } catch (error) {
      console.error("Error processing with Gemini API:", error);
      setResult("Sorry, there was an error processing your request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };



  const resetForm = () => {
    setFile(null);
    setFileContent(null);
    setJobDescription('');
    setStep(1);
    setSelectedAction('');
    setResult('');
    setIsReading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (speechSynthesisRef.current) {
      window.speechSynthesis.cancel();
      speechSynthesisRef.current = null;
    }
  };

  const goToJobDescription = () => {
    if (file) {
      setStep(2);
    } else {
      alert('Please upload a resume first');
    }
  };

  const goToOptions = () => {
    if (jobDescription.trim()) {
      setStep(3);
    } else {
      alert('Please enter a job description');
    }
  };

  const readText = () => {
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      speechSynthesisRef.current = null;
      return;
    }

    const plainText = result
      .replace(/#{1,6} (.*)/g, '$1. ')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/```.*?```/gs, '')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/✅/g, 'Strength: ')
      .replace(/⚠️/g, 'Area for improvement: ');

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Select a voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => voice.name.includes('Female') || voice.name.includes('Google'));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      setIsReading(false);
      speechSynthesisRef.current = null;
    };

    window.speechSynthesis.speak(utterance);
    speechSynthesisRef.current = utterance;
    setIsReading(true);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-2xl">
      <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Resume Assistant
      </h2>

      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center w-full max-w-2xl">
          {[1, 2, 3, 4].map((stepNumber) => (
            <React.Fragment key={stepNumber}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${step >= stepNumber
                ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-500'
                }`}>
                {stepNumber}
              </div>
              {stepNumber < 4 && (
                <div className={`flex-1 h-1 mx-2 transition-all duration-300 ${step > stepNumber
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                  : 'bg-gray-200'
                  }`}></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="flex flex-col items-center">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 w-full max-w-md text-center bg-white hover:border-blue-500 transition-all duration-300">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf"
              className="hidden"
              ref={fileInputRef}
              id="resume-upload"
            />
            <label
              htmlFor="resume-upload"
              className="cursor-pointer flex flex-col items-center justify-center"
            >
              {file ? (
                <>
                  <FileText size={48} className="text-blue-500 mb-4" />
                  <p className="text-gray-800 font-medium">{file.name}</p>
                  <p className="text-gray-500 text-sm mt-2">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </>
              ) : (
                <>
                  <Upload size={48} className="text-gray-400 mb-4" />
                  <p className="text-gray-800 font-medium">Upload your resume</p>
                  <p className="text-gray-500 text-sm mt-2">PDF files only</p>
                </>
              )}
            </label>
          </div>

          <button
            onClick={goToJobDescription}
            className={`mt-8 px-8 py-3 rounded-xl font-medium transition-all duration-300 ${file
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            disabled={!file}
          >
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col items-center">
          <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-semibold mb-4 text-gray-800">Enter Job Description</h3>
            <p className="text-gray-600 mb-6">
              Paste the job description to help us provide more tailored analysis and recommendations.
            </p>

            <div className="relative">
              <Briefcase className="absolute top-3 left-3 text-gray-400" size={20} />
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste job description here..."
                className="w-full h-64 p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setStep(1)}
              className="px-8 py-3 rounded-xl font-medium border border-gray-300 hover:bg-gray-50 transition-all duration-300"
            >
              Back
            </button>

            <button
              onClick={goToOptions}
              className={`px-8 py-3 rounded-xl font-medium transition-all duration-300 ${jobDescription.trim()
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              disabled={!jobDescription.trim()}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center">
          <h3 className="text-2xl font-semibold mb-6 text-gray-800">What would you like to do with your resume?</h3>

          <div className="grid gap-4 w-full max-w-lg">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleActionSelect(action.id)}
                className={`p-6 rounded-xl border-2 text-left transition-all duration-300 ${selectedAction === action.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
              >
                <div className="font-medium mb-1 text-gray-800">{action.label}</div>
                <div className="text-sm text-gray-600">{action.description}</div>
              </button>
            ))}
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setStep(2)}
              className="px-8 py-3 rounded-xl font-medium border border-gray-300 hover:bg-gray-50 transition-all duration-300"
            >
              Back
            </button>

            <button
              onClick={processWithGemini}
              disabled={!selectedAction || isLoading}
              className={`px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-300 ${selectedAction && !isLoading
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
            >
              {isLoading ? 'Processing...' : 'Analyze Resume'}
              {!isLoading && <Send size={18} />}
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col items-center">
          <h3 className="text-2xl font-semibold mb-6 text-gray-800">Analysis Results</h3>

          <div className="flex justify-end w-full mb-2">
            <button
              onClick={readText}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${isReading
                ? 'bg-red-500 text-white hover:bg-red-600 shadow-md'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md'
                }`}
            >
              <Volume2 size={16} />
              {isReading ? 'Stop Reading' : 'Read Aloud'}
            </button>
          </div>

          <div className="bg-white p-8 rounded-xl border border-gray-200 w-full mb-8 shadow-lg overflow-hidden prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-indigo-800 prose-h3:text-indigo-700 prose-p:text-gray-700 prose-strong:text-indigo-900 prose-li:text-gray-700">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {cleanMarkdown(result)
                .replace(/✅/g, 'Checking... ✅') // Ensure emojis render well
                .replace(/⚠️/g, 'Note: ⚠️')
              }
            </ReactMarkdown>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(3)}
              className="px-8 py-3 rounded-xl font-medium border border-gray-300 hover:bg-gray-50 transition-all duration-300"
            >
              Try Another Action
            </button>

            <button
              onClick={resetForm}
              className="px-8 py-3 rounded-xl font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg transition-all duration-300"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhanceResume;