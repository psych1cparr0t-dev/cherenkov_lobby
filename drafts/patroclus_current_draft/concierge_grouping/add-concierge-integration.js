/**
 * PATROCLUS CONCIERGE INTEGRATION SCRIPT
 * =====================================
 * 
 * Add this script to upgrade your existing B-12 chat with Gemini AI
 * Just add: <script src="add-concierge-integration.js"></script>
 * 
 * Requirements:
 * - gemini-concierge.js 
 * - concierge-config.js
 * - API key configured in meta tag
 */

(function() {
    'use strict';
    
    console.log('🏛️ Loading Patroclus Concierge Integration...');
    
    // Check if required files are available
    function loadConciergeSystem() {
        // Load configuration first
        if (typeof CONCIERGE_CONFIG === 'undefined') {
            loadScript('concierge-config.js', () => {
                loadMainSystem();
            });
        } else {
            loadMainSystem();
        }
    }
    
    function loadMainSystem() {
        // Load main concierge system
        if (typeof PatroclusConcierge === 'undefined') {
            loadScript('gemini-concierge.js', () => {
                console.log('✅ Patroclus Concierge system loaded successfully');
                initializeConciergeIntegration();
            });
        } else {
            console.log('✅ Patroclus Concierge already loaded');
            initializeConciergeIntegration();
        }
    }
    
    function loadScript(src, callback) {
        const script = document.createElement('script');
        script.src = src;
        script.onload = callback;
        script.onerror = () => {
            console.error(`❌ Failed to load ${src}`);
            console.log('🔄 Continuing with fallback mode...');
            if (callback) callback();
        };
        document.head.appendChild(script);
    }
    
    function initializeConciergeIntegration() {
        // Check if API key is configured
        const apiKey = document.querySelector('meta[name="gemini-api-key"]')?.getAttribute('content');
        
        if (apiKey) {
            console.log('✅ Gemini API key detected - full AI mode available');
        } else {
            console.log('⚠️ No API key found - intelligent fallback mode active');
        }
        
        // Enhance existing B-12 chat UI with professional styling
        enhanceChatInterface();
        
        // Add concierge status indicator
        addStatusIndicator();
        
        // Override existing chat functionality if present
        integrateWithExistingChat();
        
        console.log('🏛️ Patroclus Concierge integration complete - ready for professional assistance');
    }
    
    function enhanceChatInterface() {
        // Add professional styling enhancements
        const style = document.createElement('style');
        style.id = 'concierge-integration-styles';
        style.textContent = `
            /* Professional Concierge Enhancements */
            .chat-message.gemini {
                background: rgba(41, 98, 255, 0.15);
                border-left: 3px solid rgba(41, 98, 255, 0.5);
                position: relative;
            }
            
            .chat-message.gemini::before {
                content: "🏛️";
                position: absolute;
                left: -8px;
                top: -2px;
                font-size: 12px;
                background: rgba(41, 98, 255, 0.2);
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .chat-message.gemini-typing {
                animation: typing-pulse 1.5s ease-in-out infinite;
                font-style: italic;
                opacity: 0.7;
            }
            
            @keyframes typing-pulse {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
            }
            
            #gemini-chat-header.concierge-active {
                background: linear-gradient(135deg, rgba(41, 98, 255, 0.2), rgba(41, 98, 255, 0.3));
            }
            
            .concierge-status {
                position: absolute;
                top: 10px;
                right: 50px;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #4CAF50;
                animation: pulse-green 2s ease-in-out infinite;
            }
            
            @keyframes pulse-green {
                0%, 100% { opacity: 0.5; }
                50% { opacity: 1; }
            }
            
            .concierge-status.fallback {
                background: #FF9800;
            }
            
            .concierge-status.error {
                background: #F44336;
            }
        `;
        document.head.appendChild(style);
    }
    
    function addStatusIndicator() {
        const chatHeader = document.querySelector('#gemini-chat-header');
        if (chatHeader) {
            // Add concierge class
            chatHeader.classList.add('concierge-active');
            
            // Add status indicator
            const statusIndicator = document.createElement('div');
            statusIndicator.className = 'concierge-status';
            chatHeader.appendChild(statusIndicator);
            
            // Update status based on system state
            setTimeout(() => {
                if (window.PatroclusConcierge) {
                    const status = window.PatroclusConcierge.getStatus();
                    if (status?.hasApiKey) {
                        statusIndicator.style.background = '#4CAF50'; // Green - AI active
                    } else {
                        statusIndicator.classList.add('fallback');
                        statusIndicator.style.background = '#FF9800'; // Orange - fallback mode
                    }
                }
            }, 2000);
        }
    }
    
    function integrateWithExistingChat() {
        // Wait for existing chat system to initialize
        setTimeout(() => {
            if (window.PatroclusConcierge) {
                // Integration is handled by the main concierge system
                console.log('🔗 Integrated with Patroclus Concierge system');
            } else {
                console.log('⚠️ Concierge system not found - chat will use existing functionality');
            }
        }, 1000);
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadConciergeSystem);
    } else {
        loadConciergeSystem();
    }
    
})();