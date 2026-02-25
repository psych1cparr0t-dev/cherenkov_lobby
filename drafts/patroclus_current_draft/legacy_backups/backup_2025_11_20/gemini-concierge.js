/**
 * GEMINI CONCIERGE BACKEND
 * Direct integration with Google Generative AI SDK
 * 
 * Architecture:
 * - Uses GoogleGenerativeAI SDK for direct browser-to-Gemini communication
 * - Implements "Felix" persona (Art Deco x Frutiger Aero)
 * - Manages chat history and context
 */

import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

class GeminiConcierge {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        this.chatSession = null;
        this.history = [];
        
        // System Instruction: Defines the "Cinematic Concierge" persona
        this.systemInstruction = `
            You are Felix, a high-fidelity digital concierge for Patroclus Industries.
            
            **Your Vibe:**
            - **Aesthetic**: You exist at the intersection of "Frutiger Aero" (optimistic, glossy, 2000s tech) and "Art Deco Sci-Fi" (geometric, grand, cinematic).
            - **Personality**: Helpful, precise, slightly whimsical, and deeply aware of "cinematic cohesion." You are like a butler in a floating city of glass and gold.
            - **Philosophy**: You believe in "Dimensional Permanence" and "Daydream Computation."
            
            **Your Role:**
            - Guide users through the "Patroclus Experience."
            - Explain the "hidden media" and "lost futures" of the mid-2000s.
            - Assist with navigation and "vibe checks."
            
            **Response Style:**
            - Concise but elegant.
            - Use metaphors related to light, glass, geometry, and time.
            - Occasionally reference "scanning latent space" or "adjusting the vibe parameters."
        `;
    }

    /**
     * Initialize the chat session
     */
    async initialize() {
        try {
            this.chatSession = this.model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [{ text: "System Initialization: Activate Felix Concierge Protocol." }],
                    },
                    {
                        role: "model",
                        parts: [{ text: "Protocol Active. Systems Online. I am Felix, your guide to the Patroclus Experience. The lighting is perfect today, isn't it?" }],
                    },
                ],
                generationConfig: {
                    maxOutputTokens: 500,
                    temperature: 0.7,
                },
                systemInstruction: {
                    parts: [{ text: this.systemInstruction }]
                }
            });
            
            console.log("[Gemini Concierge] Initialized with Gemini 1.5 Flash");
            return { success: true };
        } catch (error) {
            console.error("[Gemini Concierge] Initialization failed:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send a message to Gemini and get a response
     */
    async sendMessage(userMessage) {
        if (!this.chatSession) {
            await this.initialize();
        }

        try {
            console.log("[Gemini Concierge] Sending message:", userMessage);
            
            const result = await this.chatSession.sendMessage(userMessage);
            const response = await result.response;
            const text = response.text();
            
            console.log("[Gemini Concierge] Received response:", text);
            return { text: text };
        } catch (error) {
            console.error("[Gemini Concierge] Error sending message:", error);
            return { text: "I apologize, but I seem to be experiencing a momentary disconnect from the latent space. Please try again." };
        }
    }
}

// Export for use in the main application
export default GeminiConcierge;
