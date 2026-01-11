const { generateContentWithFallback } = require('../utils/aiHelper');
const Chat = require('../models/chatModel'); // Import Chat Model

// ... (SYSTEM_PROMPTS remain same) ... 
// Context Prompts
// Context Prompts - Enhanced for ChatGPT-style structured output
const SYSTEM_PROMPTS = {
    COURSE_DOUBT: "You are an expert academic tutor for computer science students. Explain the concept clearly using the requested structure. Focus on clarity and student-friendly language.",
    CODE_EXPLANATION: "You are a senior software engineer. Explain the provided code line-by-line, point out bugs/optimizations, and mention interview questions. Use the requested structure.",
    INTERVIEW_PREP: "You are a demanding tech interview coach. Provide core concepts, comparisons, and 'Star Method' answers. Use the requested structure.",
    RESUME_HELP: "You are an ATS-optimized resume expert. Rewrite resume bullet points with strong action verbs and metrics. Provide 3 variations.",
    ROADMAP_GEN: "You are an expert career counselor and curriculum designer. Create detailed, step-by-step learning roadmaps with timeframes, resources, and project ideas. Output clean Markdown.",
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
 * @desc    Get AI Response (and save to Chat History if enabled)
 * @route   POST /api/ai/ask
 * @access  Private
 */
const askAI = async (req, res) => {
    const { context, question, code, prompt, chatId } = req.body;

    if (!question && !code && !prompt) {
        return res.status(400).json({ message: "Please provide a question, code snippet, or prompt." });
    }

    const selectedContext = SYSTEM_PROMPTS[context] || SYSTEM_PROMPTS['GENERAL'];

    // Construct User Prompt
    let userPrompt = req.body.prompt || "";
    if (!userPrompt) {
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
    }

    try {
        // Generate AI Response
        // Note: Currently we are NOT passing full history to Gemini here to save tokens/complexity, 
        // but we could if we fetched messages from chatId. 
        // For now, it's single-turn contextually, but referenced in history.
        const text = await generateContentWithFallback(userPrompt, selectedContext);

        // --- Chat Persistence Logic ---
        let chatData = null;
        if (req.user && req.user.id) { // Ensure authenticated
            if (chatId) {
                // Append to existing chat
                chatData = await Chat.findById(chatId);
                if (chatData && chatData.userId.toString() === req.user.id) {
                    chatData.messages.push({ role: 'user', text: userPrompt }); // Or just 'question' to be cleaner? using userPrompt is fuller.
                    chatData.messages.push({ role: 'model', text: text });
                    await chatData.save();
                }
            } else if (!chatId) {
                // Create New Chat automatically for the first message
                // Use the user's question directly for the title
                const cleanTitle = (question || userPrompt).substring(0, 50) + ((question || userPrompt).length > 50 ? "..." : "");

                chatData = await Chat.create({
                    userId: req.user.id,
                    title: cleanTitle,
                    context: context || 'GENERAL',
                    messages: [
                        { role: 'user', text: userPrompt }, // Store the full prompt in history
                        { role: 'model', text: text }
                    ]
                });
            }
        }
        // ------------------------------

        res.status(200).json({
            answer: text,
            context: context,
            chatId: chatData ? chatData._id : null
        });

    } catch (error) {
        console.error("AI Generation failed:", error);
        res.status(500).json({
            message: "AI service is currently unavailable.",
            error: error.message
        });
    }
};

// --- New Chat Management Controllers ---

const getUserChats = async (req, res) => {
    try {
        const chats = await Chat.find({ userId: req.user.id })
            .sort({ updatedAt: -1 })
            .select('title updatedAt context'); // Lightweight list
        res.status(200).json(chats);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch history" });
    }
};

const getChatById = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);
        if (!chat || chat.userId.toString() !== req.user.id) {
            return res.status(404).json({ message: "Chat not found" });
        }
        res.status(200).json(chat);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch chat" });
    }
};

const createChat = async (req, res) => {
    try {
        const { title, context, initialMessage } = req.body;
        const chat = await Chat.create({
            userId: req.user.id,
            title: title || "New Conversation",
            context: context || 'GENERAL',
            messages: initialMessage ? [initialMessage] : []
        });
        res.status(201).json(chat);
    } catch (error) {
        res.status(500).json({ message: "Failed to create chat" });
    }
};

const deleteChat = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);
        if (!chat || chat.userId.toString() !== req.user.id) {
            return res.status(404).json({ message: "Chat not found" });
        }
        await chat.deleteOne();
        res.status(200).json({ message: "Chat deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete chat" });
    }
};

const saveMessage = async (req, res) => {
    try {
        const { chatId, role, text } = req.body;
        const chat = await Chat.findById(chatId);
        if (!chat || chat.userId.toString() !== req.user.id) {
            return res.status(404).json({ message: "Chat not found" });
        }
        chat.messages.push({ role, text, timestamp: new Date() });
        // Update updated at
        chat.updatedAt = new Date();
        await chat.save();
        res.status(200).json(chat);
    } catch (error) {
        res.status(500).json({ message: "Failed to save message" });
    }
};


// Export all
// Make sure to update module.exports at the bottom




/**
 * @desc    Translate Code
 * @route   POST /api/ai/translate
 * @access  Private
 */
const translateCode = async (req, res) => {
    const { sourceCode, sourceLang, targetLang, includeExplanation } = req.body;

    if (!sourceCode) {
        return res.status(400).json({ message: "Source code is required." });
    }

    try {
        const prompt = `
            You are an expert software engineer and polyglot programmer.
            
            Task:
            Convert the provided source code from ${sourceLang} to ${targetLang}.
            
            Rules:
            1. Preserve the original logic and functionality exactly.
            2. Follow strict best practices and idiomatic syntax of ${targetLang} (the target language).
            3. Improve variable naming if the original is poor, but keep it recognizable.
            4. Add helpful comments explaining complex parts.
            5. REQUIRED: Output strictly valid JSON. Do not add conversational text outside the JSON.
            
            ${includeExplanation ? `Also provide a brief explanation of the key changes, focusing on syntax differences or language-specific idioms used.` : ''}
            
            Output strictly valid JSON in the following format:
            {
              "sourceLanguage": "${sourceLang}",
              "targetLanguage": "${targetLang}",
              "convertedCode": "THE_TRANSLATED_CODE_HERE",
              "explanation": "THE_EXPLANATION_HERE (optional)"
            }
            
            Source Code:
            ${sourceCode}
        `;

        const text = await generateContentWithFallback(prompt);

        // Robust JSON extraction
        let jsonResponse;
        try {
            // Find the first '{' and the last '}' to isolate JSON
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const potentialJson = jsonMatch ? jsonMatch[0] : text;

            jsonResponse = JSON.parse(potentialJson);
        } catch (e) {
            console.error("JSON Parse Error in Translate:", e);
            // Fallback: return raw text as code but try to clean it
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            jsonResponse = {
                sourceLanguage: sourceLang,
                targetLanguage: targetLang,
                convertedCode: cleanText,
                explanation: "Could not parse structured response. Showing raw output."
            };
        }

        // --- Log Activity & Add Points ---
        try {
            const User = require('../models/userModel');
            await User.findByIdAndUpdate(req.user.id, {
                $push: {
                    activityLog: {
                        action: 'code_translation',
                        details: `Translated ${sourceLang} to ${targetLang}`,
                        timestamp: new Date()
                    }
                },
                $inc: { 'gamification.points': 5 } // +5 XP per translation
            });
        } catch (err) {
            console.error("Failed to log translation activity:", err);
        }

        res.status(200).json(jsonResponse);

    } catch (error) {
        console.error("AI Translation failed:", error);
        res.status(500).json({
            message: "AI translation failed.",
            error: error.message
        });
    }
};

module.exports = {
    askAI,
    translateCode,
    getUserChats,
    getChatById,
    createChat,
    deleteChat,
    saveMessage
};
