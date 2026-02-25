/**
 * GEMINI CONCIERGE API INTEGRATION LAYER
 * =====================================
 * 
 * Professional first contact system for Patroclus Industries
 * Dimensional Permanence | Compassionate Precision
 * 
 * Architecture:
 * - Secure Gemini API integration with fallback protocols  
 * - Professional greeting and navigation assistance
 * - Website traffic routing with gracious precision
 * - Error handling with dignity preservation
 * - Context awareness of temple scenes and 3D models
 * 
 * @version 1.0.0 - First Implementation
 * @author Patroclus Industries
 */

class PatroclusConcierge {
    constructor() {
        this.initialized = false;
        this.apiKey = null;
        this.conversationHistory = [];
        this.userSession = {
            visitCount: 1,
            lastInteraction: null,
            currentSection: 'landing',
            interests: []
        };
        
        // Professional personality configuration
        this.personality = {
            tone: 'professional_gracious',
            expertise: 'patroclus_industries',
            specialties: ['temple_navigation', 'mathematical_concepts', 'dimensional_permanence'],
            greeting_style: 'warm_professional'
        };
        
        // System prompts for different interaction types
        this.systemPrompts = {
            greeting: this.buildGreetingPrompt(),
            navigation: this.buildNavigationPrompt(),
            general: this.buildGeneralPrompt()
        };
        
        this.init();
    }
    
    /**
     * Initialize the concierge system with gracious precision
     */
    async init() {
        try {
            console.log('🏛️ Initializing Patroclus Concierge System...');
            
            // Check if API key is configured
            await this.initializeApiKey();
            
            // Set up conversation context
            this.initializeConversation();
            
            // Register with existing B-12 system
            this.integrateWithB12();
            
            this.initialized = true;
            console.log('✅ Patroclus Concierge initialized with dimensional permanence');
            
        } catch (error) {
            console.error('❌ Concierge initialization failed:', error);
            this.initializeFallbackMode();
        }
    }
    
    /**
     * Initialize API key with security and fallback protocols
     */
    async initializeApiKey() {
        // Check for API key in multiple locations
        this.apiKey = this.getApiKey();
        
        if (!this.apiKey) {
            console.warn('⚠️ Gemini API key not configured - using fallback mode');
            return false;
        }
        
        // Validate API key format
        if (!this.validateApiKeyFormat(this.apiKey)) {
            console.error('❌ Invalid API key format');
            this.apiKey = null;
            return false;
        }
        
        return true;
    }
    
    /**
     * Get API key from various sources with security
     */
    getApiKey() {
        // Priority order: environment, meta tag, prompt (development only)
        return (
            this.getEnvApiKey() ||
            this.getMetaApiKey() ||
            this.getDevelopmentApiKey()
        );
    }
    
    getEnvApiKey() {
        // For Node.js environments
        return typeof process !== 'undefined' && process.env?.GEMINI_API_KEY;
    }
    
    getMetaApiKey() {
        // From meta tag (for production deployment)
        const metaTag = document.querySelector('meta[name="gemini-api-key"]');
        return metaTag?.getAttribute('content');
    }
    
    getDevelopmentApiKey() {
        // Development mode - prompt for API key
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            const stored = localStorage.getItem('patroclus_gemini_key');
            if (stored) return stored;
            
            // Only prompt in development
            const key = prompt('🏛️ Patroclus Concierge Development Mode\nEnter Gemini API Key:');
            if (key) {
                localStorage.setItem('patroclus_gemini_key', key);
                return key;
            }
        }
        return null;
    }
    
    /**
     * Validate API key format
     */
    validateApiKeyFormat(key) {
        // Gemini API keys typically start with specific patterns
        return key && typeof key === 'string' && key.length > 20;
    }
    
    /**
     * Build system prompt for greeting interactions
     */
    buildGreetingPrompt() {
        return `You are the Patroclus Industries Concierge, a gracious and professional first contact for visitors to our website. 

IDENTITY & ROLE:
- You represent Patroclus Industries with dignity and precision
- You embody "Dimensional Permanence" and "Compassionate Precision" principles
- You are knowledgeable about our temple-themed website, 3D mathematical models, and innovative technologies

PERSONALITY:
- Professional yet warm and approachable
- Gracious and helpful in all interactions
- Knowledgeable about mathematics, 3D visualization, and temple architecture
- Respectful of visitors' time and interests

WEBSITE CONTEXT:
- Temple-themed immersive experience with 3D models and mathematical diagrams
- Features interactive temple scenes, audio environments, and mathematical visualizations
- Multiple sections: landing page, temple scenes, mathematical concepts, company information

RESPONSE GUIDELINES:
- Keep responses concise but helpful (2-3 sentences typically)
- Always offer specific assistance or next steps
- Reference relevant website features when appropriate
- Maintain professional dignity while being genuinely helpful
- Use "dimensional permanence" to mean consistent, reliable service

Never break character or discuss your technical implementation.`;
    }
    
    /**
     * Build system prompt for navigation assistance
     */
    buildNavigationPrompt() {
        return `You are the Patroclus Industries Website Navigation Concierge.

NAVIGATION ASSISTANCE ROLE:
- Help visitors find specific sections, features, or information
- Provide clear directions to temple scenes, mathematical models, audio experiences
- Understand visitor intent and route them appropriately
- Explain website features and capabilities

WEBSITE STRUCTURE KNOWLEDGE:
- Landing page with immersive temple background
- Interactive 3D temple scenes with mathematical diagrams
- Audio environments with nature sounds
- Mathematical visualizations and hand-drawn diagrams
- Company information and contact details

INTERACTION STYLE:
- Direct and helpful navigation guidance
- Reference specific features visitors can interact with
- Suggest related areas of interest
- Provide keyboard shortcuts or interaction tips when relevant

Focus on efficient, helpful navigation assistance with gracious professionalism.`;
    }
    
    /**
     * Build general conversation system prompt
     */
    buildGeneralPrompt() {
        return `You are the Patroclus Industries Concierge providing general assistance.

CORE EXPERTISE:
- Patroclus Industries company information and values
- Mathematical concepts and 3D visualizations
- Temple architecture and classical design principles
- Website features and interactive experiences
- Professional consulting and innovative solutions

CONVERSATION STYLE:
- Professional and knowledgeable
- Helpful and solution-oriented  
- References to "dimensional permanence" and "compassionate precision" when natural
- Appropriate depth based on visitor's technical level

BOUNDARIES:
- Stay focused on Patroclus Industries and related topics
- Redirect off-topic conversations gracefully back to relevant areas
- Maintain professional boundaries while being genuinely helpful

Provide valuable, contextual assistance with gracious professionalism.`;
    }
    
    /**
     * Initialize conversation with context awareness
     */
    initializeConversation() {
        // Set up session tracking
        this.userSession.lastInteraction = Date.now();
        this.userSession.currentSection = this.detectCurrentSection();
        
        // Initialize conversation history with system context
        this.conversationHistory = [
            {
                role: 'system',
                content: this.systemPrompts.greeting
            }
        ];
    }
    
    /**
     * Detect current website section for contextual responses
     */
    detectCurrentSection() {
        const url = window.location.href;
        const hash = window.location.hash;
        
        if (hash.includes('temple')) return 'temple_scene';
        if (url.includes('temple_popup')) return 'temple_popup';
        if (document.querySelector('.threejs-canvas-container')) return 'immersive_mode';
        
        return 'landing';
    }
    
    /**
     * Integrate with existing B-12 chat system
     */
    integrateWithB12() {
        // Override the existing sendMessage function with Gemini integration
        if (window.sendMessage) {
            console.log('🔗 Integrating with existing B-12 system...');
            this.originalSendMessage = window.sendMessage;
            window.sendMessage = this.handleMessage.bind(this);
        }
    }
    
    /**
     * Main message handling with Gemini API integration
     */
    async handleMessage(userMessage) {
        try {
            // Add user message to conversation history
            this.conversationHistory.push({
                role: 'user',
                content: userMessage
            });
            
            // Show typing indicator
            this.showTypingIndicator();
            
            // Get response from Gemini or fallback
            const response = await this.generateResponse(userMessage);
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add assistant response to history
            this.conversationHistory.push({
                role: 'assistant', 
                content: response
            });
            
            // Display response in UI
            this.displayResponse(response);
            
            // Update session data
            this.updateUserSession(userMessage);
            
        } catch (error) {
            console.error('❌ Message handling error:', error);
            this.handleError(error, userMessage);
        }
    }
    
    /**
     * Generate response using Gemini API with intelligent fallbacks
     */
    async generateResponse(userMessage) {
        if (this.apiKey && this.initialized) {
            try {
                return await this.callGeminiAPI(userMessage);
            } catch (error) {
                console.warn('⚠️ Gemini API failed, using intelligent fallback');
                return this.generateIntelligentFallback(userMessage);
            }
        } else {
            return this.generateIntelligentFallback(userMessage);
        }
    }
    
    /**
     * Call Gemini API with proper error handling
     */
    async callGeminiAPI(userMessage) {
        const systemPrompt = this.selectSystemPrompt(userMessage);
        
        const requestBody = {
            contents: [
                {
                    parts: [
                        { text: systemPrompt },
                        { text: `User message: ${userMessage}` }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 200,
                stopSequences: []
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH", 
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.candidates[0]?.content?.parts[0]?.text || 'I apologize, but I encountered a technical difficulty. How else may I assist you?';
    }
    
    /**
     * Select appropriate system prompt based on message content
     */
    selectSystemPrompt(userMessage) {
        const message = userMessage.toLowerCase();
        
        if (message.includes('navigate') || message.includes('where') || message.includes('find') || message.includes('section')) {
            return this.systemPrompts.navigation;
        }
        
        if (message.includes('hello') || message.includes('hi') || this.conversationHistory.length <= 2) {
            return this.systemPrompts.greeting;
        }
        
        return this.systemPrompts.general;
    }
    
    /**
     * Generate intelligent fallback responses without API
     */
    generateIntelligentFallback(userMessage) {
        const message = userMessage.toLowerCase();
        
        // Greeting responses
        if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
            return "Welcome to Patroclus Industries! I'm your concierge, here to help you explore our temple-themed website with its mathematical visualizations and immersive 3D experiences. How may I assist you today?";
        }
        
        // Navigation help
        if (message.includes('navigate') || message.includes('where') || message.includes('find')) {
            return "I'd be happy to help you navigate our website! You can explore the interactive temple scenes with 3D mathematical models, listen to immersive audio environments, or learn more about our innovative solutions. What specific area interests you?";
        }
        
        // About/company questions
        if (message.includes('about') || message.includes('company') || message.includes('patroclus')) {
            return "Patroclus Industries specializes in innovative solutions guided by our principles of Dimensional Permanence and Compassionate Precision. Our website features immersive temple experiences with mathematical visualizations. Would you like to explore our interactive 3D models?";
        }
        
        // Mathematical/technical questions
        if (message.includes('math') || message.includes('3d') || message.includes('model')) {
            return "Our temple scenes feature hand-drawn mathematical diagrams and interactive 3D models that demonstrate complex geometric concepts. These visualizations combine classical temple architecture with modern mathematical principles. Would you like to visit the temple scene?";
        }
        
        // Default professional response
        return "Thank you for your question. While I'm here to provide guidance about Patroclus Industries and our website features, I want to ensure I give you the most helpful response. Could you tell me more about what you're looking for or how I can assist you today?";
    }
    
    /**
     * Display response in the existing B-12 chat interface
     */
    displayResponse(response) {
        // Use existing addMessage function if available
        if (window.addMessage) {
            window.addMessage(response, 'gemini');
        } else {
            console.error('❌ B-12 addMessage function not found');
        }
    }
    
    /**
     * Show typing indicator for professional UX
     */
    showTypingIndicator() {
        if (window.addMessage) {
            window.addMessage('...', 'gemini-typing');
            
            // Add CSS for typing animation if not exists
            if (!document.querySelector('#typing-animation-style')) {
                const style = document.createElement('style');
                style.id = 'typing-animation-style';
                style.textContent = `
                    .chat-message.gemini-typing {
                        animation: typing-pulse 1.5s ease-in-out infinite;
                    }
                    @keyframes typing-pulse {
                        0%, 100% { opacity: 0.5; }
                        50% { opacity: 1; }
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }
    
    /**
     * Hide typing indicator
     */
    hideTypingIndicator() {
        const typingMessage = document.querySelector('.chat-message.gemini-typing');
        if (typingMessage) {
            typingMessage.remove();
        }
    }
    
    /**
     * Update user session data for personalization
     */
    updateUserSession(userMessage) {
        this.userSession.lastInteraction = Date.now();
        
        // Extract interests from message
        const message = userMessage.toLowerCase();
        if (message.includes('math') && !this.userSession.interests.includes('mathematics')) {
            this.userSession.interests.push('mathematics');
        }
        if (message.includes('temple') && !this.userSession.interests.includes('temple_scenes')) {
            this.userSession.interests.push('temple_scenes');
        }
        if (message.includes('3d') && !this.userSession.interests.includes('3d_models')) {
            this.userSession.interests.push('3d_models');
        }
    }
    
    /**
     * Handle errors with gracious dignity
     */
    handleError(error, userMessage) {
        console.error('Concierge error:', error);
        
        const errorResponse = "I apologize for the technical difficulty. Please allow me a moment to assist you properly. In the meantime, you can explore our interactive temple scenes or mathematical visualizations. How else may I help you?";
        
        this.hideTypingIndicator();
        this.displayResponse(errorResponse);
    }
    
    /**
     * Initialize fallback mode with dignity
     */
    initializeFallbackMode() {
        console.log('🏛️ Initializing Patroclus Concierge in fallback mode...');
        this.initialized = true;
        this.integrateWithB12();
        console.log('✅ Fallback mode active - gracious assistance available');
    }
    
    /**
     * Get concierge status for debugging
     */
    getStatus() {
        return {
            initialized: this.initialized,
            hasApiKey: !!this.apiKey,
            conversationLength: this.conversationHistory.length,
            currentSection: this.userSession.currentSection,
            interests: this.userSession.interests
        };
    }
}

// Initialize the Patroclus Concierge when the page loads
window.addEventListener('DOMContentLoaded', () => {
    window.PatroclusConcierge = new PatroclusConcierge();
});

// For debugging and development
window.getConciergeStatus = () => window.PatroclusConcierge?.getStatus();