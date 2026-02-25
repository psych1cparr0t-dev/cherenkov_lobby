/**
 * PATROCLUS CONCIERGE CONFIGURATION
 * =================================
 * 
 * Configuration settings for the Gemini-powered concierge system
 * Professional deployment with security and fallback protocols
 */

const CONCIERGE_CONFIG = {
    // API Configuration
    api: {
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'gemini-pro',
        timeout: 10000, // 10 seconds
        retryAttempts: 2,
        retryDelay: 1000 // 1 second
    },
    
    // Response Generation Settings
    generation: {
        temperature: 0.7,        // Balance creativity and consistency
        topP: 0.8,              // Focus on relevant responses  
        topK: 40,               // Vocabulary selection
        maxOutputTokens: 200,   // Concise professional responses
        stopSequences: []
    },
    
    // Safety and Content Filtering
    safety: [
        {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"  
        },
        {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
    ],
    
    // Personality Configuration
    personality: {
        tone: 'professional_gracious',
        helpfulness: 'high',
        formality: 'professional_warm',
        expertise_areas: [
            'patroclus_industries',
            'mathematical_visualization', 
            'temple_architecture',
            'dimensional_permanence',
            'website_navigation'
        ],
        response_style: 'concise_helpful'
    },
    
    // Website Context Awareness
    website_context: {
        sections: {
            landing: {
                name: 'Landing Page',
                features: ['immersive_background', 'temple_themes', 'audio_environments'],
                navigation_hints: 'Press C to chat, R/D for rain effects'
            },
            temple_scene: {
                name: 'Temple Scene',
                features: ['3d_models', 'mathematical_diagrams', 'interactive_statues'],
                navigation_hints: 'Explore the temple with mouse, view mathematical cards'
            },
            temple_popup: {
                name: 'Temple Popup',
                features: ['focused_3d_view', 'diagram_details'],
                navigation_hints: 'Close popup to return to main experience'
            }
        },
        
        interactive_elements: [
            'temple_3d_models',
            'mathematical_diagrams', 
            'audio_controls',
            'background_effects',
            'navigation_menu'
        ]
    },
    
    // Conversation Management
    conversation: {
        max_history_length: 20,
        context_retention: true,
        session_timeout: 1800000, // 30 minutes
        greeting_detection: ['hello', 'hi', 'hey', 'greetings', 'good'],
        navigation_keywords: ['navigate', 'where', 'find', 'show', 'go to', 'section']
    },
    
    // Fallback Responses
    fallbacks: {
        greeting: [
            "Welcome to Patroclus Industries! I'm your concierge, here to help you explore our temple-themed website with mathematical visualizations and immersive 3D experiences. How may I assist you today?",
            "Greetings! I'm the Patroclus Industries concierge. Our website features interactive temple scenes, mathematical models, and audio environments. What would you like to explore?",
            "Hello and welcome! I'm here to guide you through our dimensional permanence experience with temple architecture and mathematical beauty. How can I help?"
        ],
        
        navigation: [
            "I'd be happy to help you navigate! You can explore temple scenes with 3D mathematical models, experience immersive audio environments, or learn about our innovative solutions. What interests you?",
            "Our website offers several areas to explore: interactive temple scenes, mathematical visualizations, and company information. Where would you like to go?",
            "Navigation assistance available! Press T for temple scenes, listen to ambient audio, or ask about specific features. How can I guide you?"
        ],
        
        general: [
            "Thank you for your question. I'm here to help with Patroclus Industries information and website navigation. Could you tell me more about what you're looking for?",
            "I appreciate your interest in Patroclus Industries. Our expertise spans mathematical visualization, temple architecture, and dimensional permanence. How may I assist?",
            "As your concierge, I'm here to provide helpful guidance about our website and services. What specific information would be most valuable to you?"
        ],
        
        error: [
            "I apologize for the technical difficulty. Please allow me a moment to assist you properly. In the meantime, explore our interactive temple scenes. How else may I help?",
            "I encountered a brief technical issue, but I'm here to help. You can navigate our temple visualizations or ask about mathematical concepts. What interests you?",
            "My apologies for the interruption. Our website features are still fully available for exploration. How can I assist you in discovering our offerings?"
        ]
    },
    
    // Performance and Monitoring
    performance: {
        typing_indicator_delay: 500,    // 0.5 seconds
        response_timeout: 15000,        // 15 seconds
        max_concurrent_requests: 3,
        cache_responses: false,         // Disable for personalized interactions
        log_interactions: true          // For improvement insights
    },
    
    // Development and Debugging
    development: {
        debug_mode: false,
        verbose_logging: false,
        simulate_api_failures: false,
        fallback_only_mode: false,
        local_storage_key: 'patroclus_gemini_key'
    }
};

// Export configuration for use by the concierge system
if (typeof window !== 'undefined') {
    window.CONCIERGE_CONFIG = CONCIERGE_CONFIG;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONCIERGE_CONFIG;
}