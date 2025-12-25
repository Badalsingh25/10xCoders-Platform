const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
// Ensure VITE_GEMINI_API_KEY or GEMINI_API_KEY is available in .env
// The user might have put it in client .env (VITE_), so we should check both or assume server .env has it
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "AIzaSyDJaXRW4m64zYRS1J74UaYIEFnJkmiYboc");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Context Prompts
const SYSTEM_PROMPTS = {
    COURSE_DOUBT: "You are an expert academic tutor. Explain the following concept clearly, with a simple usage example and a real-world analogy. Keep it concise.",
    CODE_EXPLANATION: "You are a senior software engineer. Explain the provided code line-by-line, point out any potential bugs or optimizations, and mention common interview questions related to this pattern.",
    INTERVIEW_PREP: "You are a demanding tech interview coach. Provide the core concept, a comparison table (if applicable), 'When to use' scenarios, and a model 'Star Method' answer for the user.",
    RESUME_HELP: "You are an ATS-optimized resume expert. Rewrite the user's resume bullet point using strong action verbs (e.g., Architected, Optimized, Spearheaded) and quantify impact with numbers. Provide 3 variations.",
    GENERAL: "You are a helpful and intelligent programming assistant. Answer the user's query accurately."
};

/**
 * @desc    Get AI Response
 * @route   POST /api/ai/ask
 * @access  Private (or Public if desired, but Private is safer)
 */
const askAI = async (req, res) => {
    const { context, question, code } = req.body;

    if (!question && !code) {
        return res.status(400).json({ message: "Please provide a question or code snippet." });
    }

    const selectedContext = SYSTEM_PROMPTS[context] || SYSTEM_PROMPTS['GENERAL'];

    let userPrompt = `Context: ${context}\n\nQuestion: ${question}`;
    if (code) {
        userPrompt += `\n\nCode Snippet:\n${code}`;
    }

    try {
        // Generate content
        // We can use a chat session if we want history, but valid for single turn too
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
