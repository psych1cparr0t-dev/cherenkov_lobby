/**
 * FELIX CONCIERGE BACKEND - N8n Integration & Agent Capabilities
 *
 * This module provides the backend integration layer for Felix,
 * connecting the desktop mate UI to N8n workflows and external services.
 *
 * Architecture:
 * - N8n webhook endpoints for agent capabilities
 * - Enrichment module for context retention and self-awareness
 * - MCP-like tool orchestration
 * - Real-time capability activation
 */

class FelixBackend {
    constructor(config = {}) {
        this.n8nBaseUrl = config.n8nBaseUrl || 'http://localhost:5678/webhook';
        this.conversationHistory = [];
        this.contextMemory = new Map();
        this.capabilities = {
            webScraping: false,
            database: false,
            api: false,
            files: false,
            memory: true // Always active
        };
        this.enrichmentModule = new EnrichmentModule();
        this.isInitialized = false;
    }

    /**
     * Initialize the backend and check N8n connectivity
     */
    async initialize() {
        try {
            console.log('[Felix Backend] Initializing...');

            // Check N8n connectivity
            const healthCheck = await this.checkN8nHealth();

            if (healthCheck.success) {
                console.log('[Felix Backend] Connected to N8n successfully');
                this.isInitialized = true;
                this.activateAllCapabilities();
            } else {
                console.warn('[Felix Backend] N8n not available, running in demo mode');
                this.isInitialized = false;
            }

            // Initialize enrichment module
            await this.enrichmentModule.initialize();

            return { success: true, mode: this.isInitialized ? 'live' : 'demo' };
        } catch (error) {
            console.error('[Felix Backend] Initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check N8n health status
     */
    async checkN8nHealth() {
        try {
            const response = await fetch(`${this.n8nBaseUrl}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Process user message through agent capabilities
     */
    async processMessage(message, context = {}) {
        // Add to conversation history
        this.addToHistory('user', message);

        // Update enrichment module
        await this.enrichmentModule.processInput(message, context);

        // Determine required capabilities
        const requiredCapabilities = this.analyzeRequiredCapabilities(message);

        // Route to appropriate handler
        let response;
        if (this.isInitialized) {
            response = await this.processWithN8n(message, requiredCapabilities, context);
        } else {
            response = await this.processDemoMode(message, requiredCapabilities);
        }

        // Add to history
        this.addToHistory('felix', response.text);

        // Update context memory
        this.updateContextMemory(message, response);

        return response;
    }

    /**
     * Process message through N8n workflows
     */
    async processWithN8n(message, capabilities, context) {
        try {
            // Activate visual indicators
            capabilities.forEach(cap => this.activateCapability(cap));

            // Prepare payload with enrichment context
            const payload = {
                message: message,
                capabilities: capabilities,
                context: {
                    ...context,
                    conversationHistory: this.conversationHistory.slice(-10),
                    memoryContext: this.enrichmentModule.getRelevantContext(message),
                    awareness: this.enrichmentModule.getSelfAwarenessState()
                },
                timestamp: new Date().toISOString()
            };

            // Send to N8n webhook
            const response = await fetch(`${this.n8nBaseUrl}/felix-agent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`N8n request failed: ${response.statusText}`);
            }

            const data = await response.json();

            return {
                text: data.response || data.message,
                capabilities: data.capabilitiesUsed || capabilities,
                metadata: data.metadata || {},
                thinking: data.reasoning || null
            };

        } catch (error) {
            console.error('[Felix Backend] N8n processing error:', error);
            return {
                text: `I encountered an issue processing your request: ${error.message}. Let me try to help anyway...`,
                error: true
            };
        } finally {
            // Deactivate capability indicators after delay
            setTimeout(() => {
                capabilities.forEach(cap => this.deactivateCapability(cap));
            }, 2000);
        }
    }

    /**
     * Demo mode processing (when N8n is unavailable)
     */
    async processDemoMode(message, capabilities) {
        const lower = message.toLowerCase();

        // Simple pattern matching for demo
        if (lower.includes('scrape') || lower.includes('website') || lower.includes('fetch')) {
            return {
                text: "I can scrape websites and extract data! Once connected to N8n, I'll use workflows to fetch, parse, and analyze web content. I can handle dynamic sites, authenticate when needed, and extract structured data.",
                capabilities: ['webScraping'],
                demo: true
            };
        }

        if (lower.includes('database') || lower.includes('store') || lower.includes('save')) {
            return {
                text: "I have database capabilities! I can perform CRUD operations, run queries, analyze data patterns, and manage your information. With N8n integration, I'll connect to PostgreSQL, MongoDB, or your preferred database.",
                capabilities: ['database'],
                demo: true
            };
        }

        if (lower.includes('api') || lower.includes('integrate') || lower.includes('connect')) {
            return {
                text: "I can integrate with external APIs! Weather, news, AI models, payment systems - you name it. Through N8n workflows, I'll orchestrate multi-step API calls and handle authentication automatically.",
                capabilities: ['api'],
                demo: true
            };
        }

        if (lower.includes('file') || lower.includes('upload') || lower.includes('document')) {
            return {
                text: "I handle file operations! Upload, download, process, convert - I work with documents, images, videos, and more. N8n enables me to run OCR, image analysis, and document parsing workflows.",
                capabilities: ['files'],
                demo: true
            };
        }

        if (lower.includes('remember') || lower.includes('context') || lower.includes('aware')) {
            const awareness = this.enrichmentModule.getSelfAwarenessState();
            return {
                text: `Yes, I maintain contextual awareness! I remember our conversation (${this.conversationHistory.length} messages), track patterns in your requests, and build understanding over time. My enrichment module gives me self-awareness: I know my current state (${awareness.state}), confidence level (${Math.round(awareness.confidence * 100)}%), and active context domains.`,
                capabilities: ['memory'],
                demo: true
            };
        }

        // Default response with personality
        const responses = [
            "That's interesting! With full N8n backend integration, I'll be able to process that comprehensively. Right now I'm demonstrating my desktop mate behavior and UI capabilities.",
            "Great question! My agent capabilities will shine once connected to the N8n workflows. I'm designed to handle complex, multi-step operations across web scraping, databases, APIs, and file processing.",
            "I'm listening! 👂 When the N8n backend is active, I'll coordinate multiple tools and services to give you comprehensive answers. For now, try asking about my capabilities or testing my context memory!"
        ];

        return {
            text: responses[Math.floor(Math.random() * responses.length)],
            capabilities: [],
            demo: true
        };
    }

    /**
     * Analyze which capabilities are needed for a message
     */
    analyzeRequiredCapabilities(message) {
        const lower = message.toLowerCase();
        const caps = [];

        // Keyword-based capability detection
        const capabilityKeywords = {
            webScraping: ['scrape', 'fetch', 'website', 'web page', 'crawl', 'extract'],
            database: ['database', 'query', 'store', 'save', 'retrieve', 'sql'],
            api: ['api', 'integrate', 'connect', 'service', 'endpoint'],
            files: ['file', 'upload', 'download', 'document', 'pdf', 'image'],
            memory: ['remember', 'context', 'previous', 'earlier', 'history']
        };

        for (const [capability, keywords] of Object.entries(capabilityKeywords)) {
            if (keywords.some(keyword => lower.includes(keyword))) {
                caps.push(capability);
            }
        }

        // Always include memory for context
        if (!caps.includes('memory')) {
            caps.push('memory');
        }

        return caps;
    }

    /**
     * Conversation history management
     */
    addToHistory(sender, message) {
        this.conversationHistory.push({
            sender,
            message,
            timestamp: new Date().toISOString()
        });

        // Keep last 50 messages
        if (this.conversationHistory.length > 50) {
            this.conversationHistory.shift();
        }
    }

    /**
     * Update context memory
     */
    updateContextMemory(userMessage, response) {
        const key = this.generateContextKey(userMessage);
        this.contextMemory.set(key, {
            userMessage,
            response: response.text,
            capabilities: response.capabilities,
            timestamp: new Date().toISOString()
        });
    }

    generateContextKey(message) {
        // Simple hash function for context keys
        return message.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(' ')
            .slice(0, 3)
            .join('_');
    }

    /**
     * Capability activation (visual feedback)
     */
    activateCapability(capability) {
        const capabilityMap = {
            webScraping: 'web-scraping',
            database: 'database',
            api: 'api',
            files: 'files',
            memory: 'memory'
        };

        const dotSelector = capabilityMap[capability];
        if (dotSelector && window.activateCapability) {
            window.activateCapability(dotSelector);
        }

        this.capabilities[capability] = true;
    }

    deactivateCapability(capability) {
        this.capabilities[capability] = false;
    }

    activateAllCapabilities() {
        Object.keys(this.capabilities).forEach(cap => {
            this.capabilities[cap] = true;
        });
    }
}

/**
 * ENRICHMENT MODULE - Self-Awareness & Context Retention
 *
 * Provides Felix with:
 * - Long-term memory across sessions
 * - Self-awareness of capabilities and state
 * - Learning from interactions
 * - Emotional context modeling
 */
class EnrichmentModule {
    constructor() {
        this.sessionContext = {
            startTime: Date.now(),
            interactionCount: 0,
            topics: new Set(),
            sentiment: 'neutral',
            userPreferences: {}
        };

        this.selfAwareness = {
            state: 'attentive', // idle, attentive, active, thinking
            confidence: 0.8,
            activeDomains: [],
            uncertainties: []
        };

        this.longTermMemory = this.loadLongTermMemory();
    }

    async initialize() {
        console.log('[Enrichment Module] Initializing self-awareness system...');

        // Load previous session data if available
        this.restoreSessionContext();

        // Initialize awareness state
        this.updateSelfAwareness('attentive', 0.9, []);

        return { success: true };
    }

    /**
     * Process input and update context
     */
    async processInput(message, context = {}) {
        this.sessionContext.interactionCount++;

        // Extract topics
        const topics = this.extractTopics(message);
        topics.forEach(topic => this.sessionContext.topics.add(topic));

        // Analyze sentiment
        this.sessionContext.sentiment = this.analyzeSentiment(message);

        // Update self-awareness
        this.updateSelfAwareness('active', 0.95, topics);

        // Store in long-term memory
        this.addToLongTermMemory(message, context);

        // Persist session context
        this.persistSessionContext();
    }

    /**
     * Get relevant context for a query
     */
    getRelevantContext(query) {
        const topics = this.extractTopics(query);
        const relevantMemories = [];

        // Search long-term memory
        for (const [key, memory] of this.longTermMemory.entries()) {
            const memoryTopics = this.extractTopics(memory.message);
            const overlap = topics.filter(t => memoryTopics.includes(t));

            if (overlap.length > 0) {
                relevantMemories.push({
                    ...memory,
                    relevance: overlap.length / topics.length
                });
            }
        }

        // Sort by relevance
        relevantMemories.sort((a, b) => b.relevance - a.relevance);

        return {
            recentTopics: Array.from(this.sessionContext.topics),
            relevantMemories: relevantMemories.slice(0, 5),
            sessionInfo: {
                duration: Date.now() - this.sessionContext.startTime,
                interactions: this.sessionContext.interactionCount,
                sentiment: this.sessionContext.sentiment
            }
        };
    }

    /**
     * Get current self-awareness state
     */
    getSelfAwarenessState() {
        return {
            state: this.selfAwareness.state,
            confidence: this.selfAwareness.confidence,
            activeDomains: this.selfAwareness.activeDomains,
            uncertainties: this.selfAwareness.uncertainties,
            sessionDuration: Date.now() - this.sessionContext.startTime,
            totalInteractions: this.sessionContext.interactionCount
        };
    }

    /**
     * Update self-awareness state
     */
    updateSelfAwareness(state, confidence, domains) {
        this.selfAwareness.state = state;
        this.selfAwareness.confidence = confidence;
        this.selfAwareness.activeDomains = domains;

        // Log state changes
        console.log(`[Self-Awareness] State: ${state}, Confidence: ${Math.round(confidence * 100)}%, Domains: ${domains.join(', ')}`);
    }

    /**
     * Extract topics from text
     */
    extractTopics(text) {
        const topicKeywords = {
            'web-development': ['website', 'web', 'html', 'css', 'javascript'],
            'data': ['data', 'database', 'query', 'store', 'analyze'],
            'automation': ['automate', 'workflow', 'process', 'batch'],
            'integration': ['api', 'integrate', 'connect', 'service'],
            'files': ['file', 'document', 'upload', 'download'],
            'ai': ['ai', 'machine learning', 'model', 'intelligence']
        };

        const lower = text.toLowerCase();
        const topics = [];

        for (const [topic, keywords] of Object.entries(topicKeywords)) {
            if (keywords.some(keyword => lower.includes(keyword))) {
                topics.push(topic);
            }
        }

        return topics;
    }

    /**
     * Analyze sentiment
     */
    analyzeSentiment(text) {
        const lower = text.toLowerCase();

        const positiveWords = ['great', 'good', 'thanks', 'awesome', 'excellent', 'love', 'amazing'];
        const negativeWords = ['bad', 'issue', 'problem', 'error', 'fail', 'wrong', 'broken'];

        const positiveCount = positiveWords.filter(word => lower.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lower.includes(word)).length;

        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    /**
     * Long-term memory management
     */
    loadLongTermMemory() {
        try {
            const stored = localStorage.getItem('felix_long_term_memory');
            return stored ? new Map(JSON.parse(stored)) : new Map();
        } catch (error) {
            console.warn('[Enrichment] Could not load long-term memory:', error);
            return new Map();
        }
    }

    addToLongTermMemory(message, context) {
        const key = `mem_${Date.now()}`;
        this.longTermMemory.set(key, {
            message,
            context,
            timestamp: new Date().toISOString(),
            topics: this.extractTopics(message),
            sentiment: this.sessionContext.sentiment
        });

        // Keep last 100 memories
        if (this.longTermMemory.size > 100) {
            const firstKey = this.longTermMemory.keys().next().value;
            this.longTermMemory.delete(firstKey);
        }

        this.persistLongTermMemory();
    }

    persistLongTermMemory() {
        try {
            localStorage.setItem('felix_long_term_memory',
                JSON.stringify(Array.from(this.longTermMemory.entries())));
        } catch (error) {
            console.warn('[Enrichment] Could not persist long-term memory:', error);
        }
    }

    /**
     * Session context persistence
     */
    persistSessionContext() {
        try {
            const context = {
                ...this.sessionContext,
                topics: Array.from(this.sessionContext.topics)
            };
            sessionStorage.setItem('felix_session_context', JSON.stringify(context));
        } catch (error) {
            console.warn('[Enrichment] Could not persist session context:', error);
        }
    }

    restoreSessionContext() {
        try {
            const stored = sessionStorage.getItem('felix_session_context');
            if (stored) {
                const context = JSON.parse(stored);
                this.sessionContext = {
                    ...context,
                    topics: new Set(context.topics)
                };
            }
        } catch (error) {
            console.warn('[Enrichment] Could not restore session context:', error);
        }
    }
}

// Export for use in frontend
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FelixBackend, EnrichmentModule };
}
