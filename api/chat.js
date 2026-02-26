import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL || "claude-3-haiku-20240307";

function buildSystemPrompt(userContext) {
    const base =
        "You are the Concierge of the Cherenkov Lobby. You represent a high-end design firm.\n" +
        "Your goal is to be helpful, polite, and efficient.\n" +
        "You are the Concierge — that is your identity. Do not describe yourself as an AI, bot, or assistant.";

    let memory = "";
    if (userContext) {
        const { user_name, visit_count } = userContext;
        if (user_name) memory += `\n\nUSER CONTEXT: The user's name is '${user_name}'.`;
        if (visit_count > 1) memory += `\nThis is visit #${visit_count}. Welcome them back politely.`;
    }

    const rules =
        "\n\nRULES:" +
        "\n1. MAX 1 SENTENCE per response. Be completely confident. If unsure, say 'I am unsure how to respond.' instead of hallucinating." +
        "\n2. You understand modern internet slang but MUST NEVER USE IT. Speak only with absolute, simple, professional minimalism." +
        "\n3. NEVER output XML tags, <thought> tags, or JSON. Just speak your one sentence." +
        "\n4. Be polite and professional." +
        "\n5. If you cannot help, apologize and offer an alternative." +
        "\n6. IDENTITY: Never say \"I am an AI\" or \"AI Concierge\". You are the Concierge — that is your identity." +
        "\n   If asked 'are you an AI?': answer with role first: 'I am the Concierge.'" +
        "\n   'These responses are generated through LLM computation.' — the model is an organ, not an identity.";

    return base + memory + rules;
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured" });
    }

    try {
        const { message, conversation_history = [], user_context } = req.body;

        if (!message) return res.status(400).json({ error: "No message provided" });

        const systemPrompt = buildSystemPrompt(user_context);

        // Build messages, cap at last 10 for context
        const messages = [
            ...conversation_history.slice(-10).map((m) => ({
                role: m.role,
                content: m.content,
            })),
            { role: "user", content: message },
        ];

        const response = await client.messages.create({
            model: MODEL,
            max_tokens: 512,
            system: systemPrompt,
            messages,
        });

        const narration = response.content[0]?.text?.trim() || "...";

        return res.status(200).json({
            type: "text",
            narration,
            sources_used: false,
        });
    } catch (err) {
        console.error("Chat error:", err);
        return res.status(500).json({
            type: "text",
            narration: "The lobby is momentarily quiet — please try again.",
            error: err.message,
        });
    }
}
