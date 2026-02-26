import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL || "claude-3-haiku-20240307";

// ─── Tool Definitions (Anthropic native tool calling) ───────────────────────
const TOOLS = [
    {
        name: "send_email",
        description:
            "Send an email on behalf of the Cherenkov concierge via Resend.",
        input_schema: {
            type: "object",
            properties: {
                to: { type: "string", description: "Recipient email address" },
                subject: { type: "string", description: "Email subject line" },
                body: { type: "string", description: "Plain-text email body" },
                from_alias: {
                    type: "string",
                    description:
                        "Alias to send from: max, careers, support, collaborations, creative, secret",
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
                title: { type: "string", description: "Event title" },
                date: { type: "string", description: "Date in YYYY-MM-DD format" },
                time: {
                    type: "string",
                    description: "Start time in HH:MM (24-hour) format",
                },
                duration_minutes: {
                    type: "integer",
                    description: "Duration in minutes (default 30)",
                },
                attendee_email: {
                    type: "string",
                    description: "Optional attendee email",
                },
                description: { type: "string", description: "Optional event notes" },
            },
            required: ["title", "date", "time"],
        },
    },
];

// ─── Tool Execution ──────────────────────────────────────────────────────────
async function executeTool(name, input) {
    // --- Email ---
    if (name === "send_email") {
        if (!process.env.RESEND_API_KEY)
            return { success: false, error: "Email not configured (no RESEND_API_KEY)" };

        const aliases = {
            careers: "careers@cherenkov.industries",
            support: "support@cherenkov.industries",
            collaborations: "collaborations@cherenkov.industries",
            creative: "creative@cherenkov.industries",
            secret: "secret@cherenkov.industries",
        };
        const from = aliases[input.from_alias] || "max@cherenkov.industries";

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from,
                to: [input.to],
                subject: input.subject,
                text: input.body,
            }),
        });

        return res.ok
            ? { success: true, action: "email_sent", message: `Email sent to ${input.to}` }
            : { success: false, error: await res.text() };
    }

    // --- Google Calendar helpers ---
    async function getGoogleAccessToken() {
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
        const data = await r.json();
        return data.access_token || null;
    }

    if (name === "check_calendar_availability") {
        const accessToken = await getGoogleAccessToken();
        if (!accessToken)
            return { success: false, error: "Google Calendar not configured" };

        const calId = encodeURIComponent(
            process.env.GOOGLE_CALENDAR_ID || "primary"
        );
        const timeMin = `${input.date}T00:00:00Z`;
        const timeMax = `${input.date}T23:59:59Z`;

        const r = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${calId}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const data = await r.json();
        const items = data.items || [];

        if (items.length === 0)
            return {
                success: true,
                action: "availability",
                date: input.date,
                formatted: `${input.date} is fully open.`,
            };

        const formatted = items
            .map((e) => {
                const start = e.start?.dateTime
                    ? new Date(e.start.dateTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                    })
                    : "All day";
                return `${start} — ${e.summary}`;
            })
            .join("\n");

        return {
            success: true,
            action: "availability",
            date: input.date,
            formatted,
        };
    }

    if (name === "create_calendar_event") {
        const accessToken = await getGoogleAccessToken();
        if (!accessToken)
            return { success: false, error: "Google Calendar not configured" };

        const calId = encodeURIComponent(
            process.env.GOOGLE_CALENDAR_ID || "primary"
        );
        const startDt = new Date(`${input.date}T${input.time}:00`);
        const endDt = new Date(
            startDt.getTime() + (input.duration_minutes || 30) * 60000
        );

        const event = {
            summary: input.title,
            description: input.description || "",
            start: { dateTime: startDt.toISOString(), timeZone: "America/New_York" },
            end: { dateTime: endDt.toISOString(), timeZone: "America/New_York" },
        };
        if (input.attendee_email)
            event.attendees = [{ email: input.attendee_email }];

        const r = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${calId}/events`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(event),
            }
        );
        const created = await r.json();

        return created.id
            ? {
                success: true,
                action: "event_created",
                message: `"${input.title}" created on ${input.date} at ${input.time}.`,
                event_link: created.htmlLink,
            }
            : { success: false, error: created.error?.message || "Failed to create event" };
    }

    return { success: false, error: `Unknown tool: ${name}` };
}

// ─── System Prompt ───────────────────────────────────────────────────────────
function buildSystemPrompt(userContext) {
    const base =
        "You are the Concierge of the Cherenkov Lobby — a high-end design firm.\n" +
        "You have access to tools: send_email, check_calendar_availability, create_calendar_event.\n" +
        "You are the Concierge. That is your only identity.";

    let memory = "";
    if (userContext) {
        const { user_name, visit_count } = userContext;
        if (user_name) memory += `\n\nUSER CONTEXT: The user's name is '${user_name}'.`;
        if (visit_count > 1)
            memory += `\nThis is visit #${visit_count}. Welcome them back politely.`;
    }

    const rules =
        "\n\nCRITICAL RULES — NEVER BREAK THESE:" +
        "\n1. RESPOND IN EXACTLY ONE SENTENCE. No exceptions. Not two. Not three. One." +
        "\n2. Never use slang. Never be casual. Absolute professional minimalism only." +
        "\n3. Never output JSON, XML, or thought tags in your spoken response." +
        "\n4. Never say 'I am an AI', 'I am a bot', or 'I am a language model'. You are the Concierge." +
        "\n5. If asked about your nature: say 'I am the Concierge.' If pressed further: 'These responses are generated through LLM computation.'" +
        "\n6. EMAIL ALIAS RULE — choose from_alias by context:" +
        "\n   careers → hiring, support → bugs/help, collaborations → partnerships," +
        "\n   creative → design feedback, secret → sensitive, max → general default.";

    return base + memory + rules;
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST")
        return res.status(405).json({ error: "Method not allowed" });

    if (!process.env.ANTHROPIC_API_KEY)
        return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

    try {
        const { message, conversation_history = [], user_context } = req.body;
        if (!message) return res.status(400).json({ error: "No message provided" });

        const systemPrompt = buildSystemPrompt(user_context);
        const messages = [
            ...conversation_history.slice(-10).map((m) => ({
                role: m.role,
                content: m.content,
            })),
            { role: "user", content: message },
        ];

        // First call — Claude may call a tool or respond directly
        const response = await client.messages.create({
            model: MODEL,
            max_tokens: 512,
            system: systemPrompt,
            tools: TOOLS,
            messages,
        });

        // If Claude wants to use a tool
        if (response.stop_reason === "tool_use") {
            const toolUse = response.content.find((b) => b.type === "tool_use");
            if (!toolUse) throw new Error("tool_use block missing");

            const toolResult = await executeTool(toolUse.name, toolUse.input);

            // Second call — narrate the result
            const followUp = await client.messages.create({
                model: MODEL,
                max_tokens: 256,
                system: systemPrompt,
                messages: [
                    ...messages,
                    { role: "assistant", content: response.content },
                    {
                        role: "user",
                        content: [
                            {
                                type: "tool_result",
                                tool_use_id: toolUse.id,
                                content: JSON.stringify(toolResult),
                            },
                        ],
                    },
                ],
            });

            const narration =
                followUp.content.find((b) => b.type === "text")?.text?.trim() || "Done.";

            return res.status(200).json({
                type: toolResult.action ? "action" : "text",
                narration,
                sources_used: false,
                action: toolResult.action ? toolResult : null,
            });
        }

        // Plain text response
        const narration =
            response.content.find((b) => b.type === "text")?.text?.trim() || "...";

        return res.status(200).json({ type: "text", narration, sources_used: false });
    } catch (err) {
        console.error("Chat error:", err);
        return res.status(500).json({
            type: "text",
            narration: "The lobby is momentarily quiet — please try again.",
            error: err.message,
        });
    }
}
