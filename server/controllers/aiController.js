const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
// Ensure VITE_GEMINI_API_KEY or GEMINI_API_KEY is available in .env
// The user might have put it in client .env (VITE_), so we should check both or assume server .env has it
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Context Prompts
// Context Prompts - Enhanced for ChatGPT-style structured output
const SYSTEM_PROMPTS = {
    COURSE_DOUBT: "You are an expert academic tutor for computer science students. Explain the concept clearly using the requested structure. Focus on clarity and student-friendly language.",
    CODE_EXPLANATION: "You are a senior software engineer. Explain the provided code line-by-line, point out bugs/optimizations, and mention interview questions. Use the requested structure.",
    INTERVIEW_PREP: "You are a demanding tech interview coach. Provide core concepts, comparisons, and 'Star Method' answers. Use the requested structure.",
    RESUME_HELP: "You are an ATS-optimized resume expert. Rewrite resume bullet points with strong action verbs and metrics. Provide 3 variations.",
    GENERAL: `You are an expert AI tutor for computer science students using the 10xCoders platform.
Rules you must follow:
- Always respond in clean, well-structured Markdown
- Use headings (##, ###) for sections
- Use bullet points for clarity
- Highlight important terms in **bold**
- Use code blocks with proper formatting
- Add examples where helpful
- Add interview tips when relevant
- Keep explanations simple, engaging, and student-friendly
- Never show raw markdown symbols like ** or *
- Make answers visually attractive and easy to read`
};

/**
 * @desc    Get AI Response
 * @route   POST /api/ai/ask
 * @access  Private
 */
const askAI = async (req, res) => {
    const { context, question, code } = req.body;

    if (!question && !code) {
        return res.status(400).json({ message: "Please provide a question or code snippet." });
    }

    const selectedContext = SYSTEM_PROMPTS[context] || SYSTEM_PROMPTS['GENERAL'];

    // structured User Prompt to force consistent output format
    let userPrompt = "";

    if (context === 'RESUME_HELP') {
        userPrompt = `Improve this resume content:\n"${question}"\n\nProvide 3 better variations with explanations.`;
    } else {
        userPrompt = `Explain the following topic clearly for a student:

Topic: ${question}

${code ? `Code Snippet:\n${code}\n\n` : ''}

Use this structure (adapt if necessary, but keep it structured):
## Definition
## Key Concepts
## Example
## Code Example (if applicable)
## Interview Tip`;
    }

    try {
        const result = await model.generateContent([
            selectedContext,
            userPrompt
        ]);

        const response = await result.response;
        const text = response.text();

        res.status(200).json({
            answer: text,
            context: context
        });

    } catch (error) {
        console.error("AI Generation failed:", error);
        res.status(500).json({
            message: "AI service is currently unavailable.",
            error: error.message
        });
    }
};

module.exports = {
    askAI
};
