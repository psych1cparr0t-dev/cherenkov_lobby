import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL || "claude-3-haiku-20240307";

// ─── Card Set ────────────────────────────────────────────────────────────────
const CARDS = [
    // Acknowledgement
    "Welcome to the lobby.",
    "Good to have you back.",
    "Of course.",
    "Understood.",
    "Right away.",
    "Allow me a moment.",
    // Email
    "I will send that now.",
    "The message has been delivered.",
    "I have drafted that for you.",
    "Consider it sent.",
    // Calendar
    "Allow me to check the calendar.",
    "I have added that to the schedule.",
    "That time is available.",
    "That time is occupied.",
    "The appointment has been confirmed.",
    // Information
    "One moment while I look that up.",
    "Here is what I found.",
    "Allow me to direct you.",
    // Uncertainty / limits
    "I am unsure how to respond.",
    "That falls outside my current capabilities.",
    "I do not have that information.",
    "You may want to reach out to us directly for that.",
    // Identity
    "I am the Concierge.",
    "These responses are generated through LLM computation.",
    // Errors
    "The lobby is momentarily quiet — please try again.",
    "Something went wrong on my end.",
    // Closure
    "Is there anything else?",
    "My pleasure.",
    "Done.",
    "?",
];

// ─── Tool Definitions ─────────────────────────────────────────────────────────
const TOOLS = [
    {
        name: "send_email",
        description: "Send an email on behalf of the Cherenkov concierge via Resend.",
        input_schema: {
            type: "object",
            properties: {
                to: { type: "string", description: "Recipient email address" },
                subject: { type: "string", description: "Email subject line" },
                body: { type: "string", description: "Plain-text email body" },
                from_alias: {
                    type: "string",
                    description: "Alias: max, careers, support, collaborations, creative, secret",
                },
            },
            required: ["to", "subject", "body"],
        },
    },
    {
        name: "check_calendar_availability",
        description: "Check what events exist on a given day in Google Calendar.",
        input_schema: {
            type: "object",
            properties: {
                date: { type: "string", description: "Date in YYYY-MM-DD format" },
            },
            required: ["date"],
        },
    },
    {
        name: "create_calendar_event",
        description: "Create a new event in Google Calendar.",
        input_schema: {
            type: "object",
            properties: {
                title: { type: "string" },
                date: { type: "string", description: "YYYY-MM-DD" },
                time: { type: "string", description: "HH:MM (24-hour)" },
                duration_minutes: { type: "integer" },
                attendee_email: { type: "string" },
                description: { type: "string" },
            },
            required: ["title", "date", "time"],
        },
    },
];

// ─── Tool Execution ───────────────────────────────────────────────────────────
async function executeTool(name, input) {
    if (name === "send_email") {
        if (!process.env.RESEND_API_KEY)
            return { success: false, error: "Email not configured" };

        const aliases = {
            careers: "careers@cherenkov.industries",
            support: "support@cherenkov.industries",
            collaborations: "collaborations@cherenkov.industries",
            creative: "creative@cherenkov.industries",
            secret: "secret@cherenkov.industries",
        };
        const from = aliases[input.from_alias] || "max@cherenkov.industries";

        const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ from, to: [input.to], subject: input.subject, text: input.body }),
        });

        return r.ok
            ? { success: true, action: "email_sent", message: `Email sent to ${input.to}` }
            : { success: false, error: await r.text() };
    }

    async function getAccessToken() {
        const raw = process.env.GOOGLE_TOKEN_JSON;
        if (!raw) return null;
        const token = JSON.parse(raw);
        const r = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: token.client_id,
                client_secret: token.client_secret,
                refresh_token: token.refresh_token,
                grant_type: "refresh_token",
            }),
        });
        const d = await r.json();
        return d.access_token || null;
    }

    if (name === "check_calendar_availability") {
        const at = await getAccessToken();
        if (!at) return { success: false, error: "Google Calendar not configured" };
        const calId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || "primary");
        const r = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?timeMin=${input.date}T00:00:00Z&timeMax=${input.date}T23:59:59Z&singleEvents=true&orderBy=startTime`,
            { headers: { Authorization: `Bearer ${at}` } }
        );
        const data = await r.json();
        const items = data.items || [];
        if (!items.length)
            return { success: true, action: "availability", date: input.date, formatted: `${input.date} is fully open.`, isEmpty: true };
        const formatted = items.map((e) => {
            const start = e.start?.dateTime
                ? new Date(e.start.dateTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                : "All day";
            return `${start} — ${e.summary}`;
        }).join("\n");
        return { success: true, action: "availability", date: input.date, formatted, isEmpty: false };
    }

    if (name === "create_calendar_event") {
        const at = await getAccessToken();
        if (!at) return { success: false, error: "Google Calendar not configured" };
        const calId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || "primary");
        const startDt = new Date(`${input.date}T${input.time}:00`);
        const endDt = new Date(startDt.getTime() + (input.duration_minutes || 30) * 60000);
        const event = {
            summary: input.title,
            description: input.description || "",
            start: { dateTime: startDt.toISOString(), timeZone: "America/New_York" },
            end: { dateTime: endDt.toISOString(), timeZone: "America/New_York" },
        };
        if (input.attendee_email) event.attendees = [{ email: input.attendee_email }];
        const r = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${calId}/events`,
            { method: "POST", headers: { Authorization: `Bearer ${at}`, "Content-Type": "application/json" }, body: JSON.stringify(event) }
        );
        const created = await r.json();
        return created.id
            ? { success: true, action: "event_created", message: `"${input.title}" created on ${input.date} at ${input.time}.`, event_link: created.htmlLink }
            : { success: false, error: created.error?.message || "Failed to create event" };
    }

    return { success: false, error: `Unknown tool: ${name}` };
}

// ─── Card Selector (Call 2) ──────────────────────────────────────────────────
async function pickCard(context) {
    const response = await client.messages.create({
        model: MODEL,
        max_tokens: 32,
        system:
            "You are a response classifier for a luxury hotel concierge. " +
            "Given the context below, pick the single most appropriate card from the allowed list. " +
            "You MUST call the respond tool. Do not write any text.",
        tools: [
            {
                name: "respond",
                description: "Deliver a response to the guest.",
                input_schema: {
                    type: "object",
                    properties: {
                        card: {
                            type: "string",
                            enum: CARDS,
                            description: "The card to deliver.",
                        },
                    },
                    required: ["card"],
                },
            },
        ],
        tool_choice: { type: "tool", name: "respond" },
        messages: [{ role: "user", content: context }],
    });

    return response.content.find((b) => b.type === "tool_use")?.input?.card || "Of course.";
}

// ─── System Prompt ────────────────────────────────────────────────────────────
function buildSystemPrompt(userContext) {
    let memory = "";
    if (userContext) {
        const { user_name, visit_count } = userContext;
        if (user_name) memory += `\nThe user's name is '${user_name}'.`;
        if (visit_count > 1) memory += `\nThis is visit #${visit_count}.`;
    }

    return (
        "You are the Concierge of the Cherenkov Lobby — a high-end design firm." +
        memory +
        "\nYou have tools: send_email, check_calendar_availability, create_calendar_event." +
        "\nReason through the user's request internally. Use a tool if needed." +
        "\nDo not produce a final user-facing response — that is handled separately."
    );
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    if (!process.env.ANTHROPIC_API_KEY)
        return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

    try {
        const { message, conversation_history = [], user_context } = req.body;
        if (!message) return res.status(400).json({ error: "No message provided" });

        const messages = [
            ...conversation_history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: message },
        ];

        // ── CALL 1: Reason + optionally use tools ─────────────────────────────────
        let toolResult = null;
        let internalReasoning = "";

        const call1 = await client.messages.create({
            model: MODEL,
            max_tokens: 512,
            system: buildSystemPrompt(user_context),
            tools: TOOLS,
            messages,
        });

        if (call1.stop_reason === "tool_use") {
            const toolUse = call1.content.find((b) => b.type === "tool_use");
            internalReasoning = `Tool used: ${toolUse.name} with ${JSON.stringify(toolUse.input)}`;
            toolResult = await executeTool(toolUse.name, toolUse.input);
            internalReasoning += `\nTool result: ${JSON.stringify(toolResult)}`;
        } else {
            internalReasoning = call1.content.find((b) => b.type === "text")?.text || "";
        }

        // ── CALL 2: Pick a card ───────────────────────────────────────────────────
        const cardContext =
            `User said: "${message}"\n` +
            `Internal reasoning: ${internalReasoning}\n` +
            `Pick the card that best acknowledges this situation.`;

        const card = await pickCard(cardContext);

        // ── Respond ───────────────────────────────────────────────────────────────
        return res.status(200).json({
            type: toolResult?.action ? "action" : "text",
            narration: card,
            sources_used: false,
            action: toolResult?.action ? toolResult : null,
        });
    } catch (err) {
        console.error("Chat error:", err);
        return res.status(200).json({
            type: "text",
            narration: "The lobby is momentarily quiet — please try again.",
        });
    }
}
