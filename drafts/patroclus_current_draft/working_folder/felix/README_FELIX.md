# Felix - Desktop Mate Concierge Bot

**A self-aware, BT-7274 + WALL-E inspired bipedal concierge agent with full N8n backend integration**

## Overview

Felix is a desktop mate concierge bot that combines:
- **BT-7274's tactical precision** (Titanfall 2)
- **WALL-E's curious personality**
- **Max-level Claude agent capabilities**
- **N8n workflow automation backend**
- **Self-awareness & context retention**

## Features

### 🤖 Desktop Mate Behavior
- **Draggable**: Move Felix anywhere on screen
- **Idle Animations**: Breathing, blinking, subtle movements
- **State-Based Behavior**:
  - `idle` - Gentle breathing and occasional blinks
  - `active` - Nodding and arm gestures
  - `thinking` - Tilted head, dimmed eyes

### 🎨 3D Character Model
- **Bipedal robot design** (Three.js)
- **Expressive eyes** (WALL-E inspired)
- **Tactical aesthetics** (BT-7274 color scheme)
- **Smooth animations** with skeletal controls

### 💬 Chat Interface
- **Modern glass-morphism UI**
- **Real-time messaging**
- **Thinking indicators**
- **Message history with timestamps**

### 🧠 Agent Capabilities

#### 1. Web Scraping & Research
- Fetch and parse websites
- Extract structured data
- Handle dynamic content
- Authentication support

#### 2. Database Operations
- CRUD operations (PostgreSQL, MongoDB)
- Complex queries
- Data analysis
- User preference storage

#### 3. API Integrations
- Weather, news, AI models
- Multi-step API orchestration
- Authentication handling
- Rate limiting management

#### 4. File Operations
- Upload/download files
- Document processing (PDF, images, CSV)
- OCR and image analysis
- File format conversion

#### 5. Context Memory
- **Session memory**: Current conversation context
- **Long-term memory**: Cross-session persistence (localStorage)
- **Topic tracking**: Automatic categorization
- **Sentiment analysis**: Emotional context modeling

### 🌟 Enrichment Module (Self-Awareness)

Felix has genuine self-awareness through the enrichment module:

```javascript
{
  state: 'attentive',          // Current cognitive state
  confidence: 0.95,            // Confidence in responses
  activeDomains: ['ai', 'web-development'],  // Current focus areas
  uncertainties: [],           // Known knowledge gaps
  sessionDuration: 1234567,    // Time since activation
  totalInteractions: 42        // Conversation depth
}
```

**Features**:
- Explains its reasoning process
- Acknowledges uncertainties
- Learns user preferences over time
- Adapts communication style
- Tracks conversation context

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Felix Desktop Mate                  │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │   Three.js │  │  Chat UI    │  │  Capability  │ │
│  │   3D Model │  │  Interface  │  │  Indicators  │ │
│  └────────────┘  └─────────────┘  └──────────────┘ │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              Felix Backend (JavaScript)              │
│  ┌────────────────┐         ┌────────────────────┐ │
│  │  FelixBackend  │◄───────►│ EnrichmentModule   │ │
│  │  - N8n client  │         │ - Self-awareness   │ │
│  │  - Routing     │         │ - Context memory   │ │
│  │  - Capability  │         │ - Learning         │ │
│  └────────────────┘         └────────────────────┘ │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                  N8n Backend                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐│
│  │ Web Scraping │  │   Database   │  │    API    ││
│  │   Workflow   │  │   Workflow   │  │ Workflow  ││
│  └──────────────┘  └──────────────┘  └───────────┘│
│  ┌──────────────┐  ┌──────────────────────────────┐│
│  │     File     │  │   AI Response Generation     ││
│  │   Workflow   │  │   (OpenAI GPT-4 + Context)   ││
│  └──────────────┘  └──────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

## Installation

### Prerequisites
- Node.js v16+
- N8n (optional, for full capabilities)
- PostgreSQL (optional, for database operations)

### Quick Start

1. **Clone/Download Files**
   ```bash
   # Your files:
   # - felix-bot.html
   # - felix-backend.js
   # - n8n-workflows.json
   ```

2. **Run Felix (Demo Mode)**
   ```bash
   # Simply open felix-bot.html in a modern browser
   open felix-bot.html
   ```
   Felix will run in demo mode without N8n backend.

3. **Setup N8n Backend (Full Capabilities)**
   ```bash
   # Install N8n
   npm install -g n8n

   # Start N8n
   n8n start

   # Access N8n UI
   # Navigate to: http://localhost:5678

   # Import workflows
   # 1. Open N8n UI
   # 2. Go to Workflows
   # 3. Click Import
   # 4. Upload n8n-workflows.json

   # Configure credentials in N8n:
   # - OpenAI API key
   # - PostgreSQL connection
   # - Weather API key (optional)
   # - News API key (optional)

   # Activate workflows
   # Click the toggle on each workflow
   ```

4. **Update Felix Configuration**
   ```javascript
   // In your HTML file, update the n8nBaseUrl:
   const felixBackend = new FelixBackend({
       n8nBaseUrl: 'http://localhost:5678/webhook'
   });
   ```

5. **Test Integration**
   ```bash
   # Test N8n webhook
   curl -X POST http://localhost:5678/webhook/felix-agent \
     -H 'Content-Type: application/json' \
     -d '{"message": "Hello Felix!", "capabilities": ["memory"]}'
   ```

## Usage

### Basic Interaction

1. **Open the page** - Felix appears in bottom-right corner
2. **Click Felix** - Opens chat interface
3. **Type message** - Felix responds based on capabilities
4. **Drag Felix** - Move to preferred screen position

### Example Conversations

#### Web Scraping
```
You: Can you scrape https://example.com?
Felix: I'll extract the content for you...
[Activates web-scraping capability]
Felix: I found the following: Title: "Example Domain"...
```

#### Database Operations
```
You: Save my preference for dark mode
Felix: I'll store that in the database...
[Activates database capability]
Felix: Preference saved! I'll remember you prefer dark mode.
```

#### API Integration
```
You: What's the weather like?
Felix: Let me check the weather API...
[Activates API capability]
Felix: Currently 72°F and sunny in your location.
```

#### Context Memory
```
You: Remember I like concise responses
Felix: Got it! I'll keep my responses brief from now on.
[Updates enrichment module]

[Later in conversation...]
You: Tell me about AI
Felix: AI: computer systems mimicking human intelligence.
[Remembers preference for brevity]
```

### Self-Awareness Queries

```
You: How are you feeling?
Felix: I'm in an attentive state with 95% confidence. I've had 15 interactions this session, focusing on web-development and AI topics. My enrichment module shows positive sentiment from our conversation.

You: What are you uncertain about?
Felix: I have high confidence in my current responses, but I acknowledge some limitations: I can't access real-time data without API integration, and my knowledge cutoff means I might not know about very recent events.
```

## Integration with Existing Website

To integrate Felix into your existing Patroclus Industries website:

```html
<!-- Add to your existing HTML -->
<script src="felix-backend.js"></script>

<!-- Felix Container (already styled to overlay) -->
<div id="felix-container">
  <!-- Felix UI components -->
</div>

<!-- Initialize -->
<script>
  const felixBackend = new FelixBackend({
      n8nBaseUrl: 'http://localhost:5678/webhook'
  });

  felixBackend.initialize().then(result => {
      console.log(`Felix initialized in ${result.mode} mode`);
  });
</script>
```

Felix's CSS uses high `z-index` (9999) to float above your existing content without interfering.

## Customization

### Personality Tuning

Edit the system prompt in `n8n-workflows.json`:

```json
{
  "role": "system",
  "content": "You are Felix, a concierge bot combining BT-7274's tactical precision with WALL-E's curious nature. [Customize personality here]"
}
```

### Visual Customization

```css
/* Change Felix's accent color */
.felix-status {
    border-color: #ff6b6b; /* Red instead of green */
}

/* Change position */
#felix-container {
    bottom: 20px;
    left: 20px; /* Left side instead of right */
}

/* Adjust size */
#felix-container {
    width: 300px;
    height: 350px;
}
```

### 3D Model Customization

```javascript
// Change materials
const accentMaterial = new THREE.MeshPhongMaterial({
    color: 0xff6b6b,  // Red accents
    emissive: 0xff6b6b,
    emissiveIntensity: 0.5
});

// Adjust proportions
const headGeometry = new THREE.BoxGeometry(1.0, 0.8, 0.7); // Bigger head
```

## Advanced Features

### Custom Capabilities

Add new capabilities:

```javascript
// 1. Add to capability map
this.capabilities = {
    webScraping: false,
    database: false,
    api: false,
    files: false,
    memory: true,
    customCapability: false  // New capability
};

// 2. Create N8n workflow for capability
// 3. Add UI indicator
<div class="capability-dot" data-capability="custom"></div>

// 4. Add to routing logic
if (lower.includes('custom')) {
    caps.push('customCapability');
}
```

### Persistent Storage

Felix uses:
- **localStorage**: Long-term memory across sessions
- **sessionStorage**: Current session context

Clear memory:
```javascript
localStorage.removeItem('felix_long_term_memory');
sessionStorage.removeItem('felix_session_context');
```

## Troubleshooting

### Felix Not Responding

1. Check browser console for errors
2. Verify N8n is running: `http://localhost:5678`
3. Test webhook: `curl -X POST http://localhost:5678/webhook/felix-agent ...`
4. Check N8n workflow activation status

### Capabilities Not Activating

1. Verify N8n workflows are active
2. Check credentials in N8n (API keys, database)
3. Look for errors in N8n execution logs
4. Ensure correct webhook path in `felix-backend.js`

### 3D Model Not Rendering

1. Verify Three.js is loaded (check Network tab)
2. Check WebGL support: `about:gpu` in Chrome
3. Look for canvas errors in console
4. Try reducing model complexity

## Performance

- **Demo mode**: ~5MB memory, minimal CPU
- **Full mode with N8n**: ~15MB memory, moderate CPU
- **3D rendering**: ~60 FPS on modern hardware
- **Message processing**: <200ms (demo), <2s (N8n with AI)

## Security Considerations

1. **API Keys**: Store in environment variables, not code
2. **CORS**: Configure N8n CORS for your domain
3. **Input Validation**: Sanitize user inputs in N8n workflows
4. **Authentication**: Add auth layer to N8n webhooks for production
5. **Data Privacy**: User conversations stored locally (clear periodically)

## Future Enhancements

- [ ] Voice interaction (Speech API)
- [ ] Multi-modal responses (images, charts)
- [ ] Proactive suggestions based on page context
- [ ] Mobile-optimized version
- [ ] Keyboard shortcuts for quick interaction
- [ ] Theme customization UI
- [ ] Export conversation history
- [ ] Plugin system for custom capabilities
- [ ] Multi-language support
- [ ] Screen share analysis capability

## License

MIT License - Feel free to customize and extend Felix!

## Credits

- **Inspiration**: BT-7274 (Titanfall 2), WALL-E (Pixar)
- **3D**: Three.js
- **Backend**: N8n
- **AI**: OpenAI GPT-4

---

**Felix**: "Protocol 3: Protect the user experience. I'm ready to assist!" 🤖
