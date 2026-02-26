// ============================================
// LIMINAL EFFECTS
// Enhanced rain logic from backup.html + audio
// ============================================

const letters = document.querySelectorAll('.letter');
const wordmark = document.getElementById('wordmark');
const cursor = document.getElementById('cursor');
let allRevealed = false;
let conciergeStarted = false;

// Concierge messages
const conciergeMessages = [
  "welcome! hahah",
  "oh, you found us!",
  "nice to meet you ✧"
];

// --- User Memory & Persistence ---
class UserMemory {
  constructor() {
    this.storageKey = 'cherenkov_user_memory';
    this.data = this.load();
    this.incrementVisit();
  }

  load() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : this.defaultData();
    } catch (e) {
      console.error("Memory load failed", e);
      return this.defaultData();
    }
  }

  defaultData() {
    return {
      visitCount: 0,
      userName: null,
      lastTopic: null,
      firstVisitDate: new Date().toISOString(),
      lastVisitDate: new Date().toISOString()
    };
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch (e) {
      console.error("Memory save failed", e);
    }
  }

  incrementVisit() {
    // Only increment if > 1 hour since last visit to avoid spamming refresh
    const last = new Date(this.data.lastVisitDate);
    const now = new Date();
    const diffHours = (now - last) / (1000 * 60 * 60);

    if (diffHours > 1 || this.data.visitCount === 0) {
      this.data.visitCount++;
    }
    this.data.lastVisitDate = now.toISOString();
    this.save();
  }

  getContext() {
    return {
      visit_count: this.data.visitCount,
      user_name: this.data.userName,
      last_topic: this.data.lastTopic
    };
  }

  setName(name) {
    if (name && name.length < 50) { // Basic sanity check
      this.data.userName = name;
      this.save();
    }
  }
}

const userMemory = new UserMemory();


// --- Letter Reveal on Mouse Proximity ---
document.addEventListener('mousemove', (e) => {
  if (conciergeStarted) return; // Stop tracking once concierge starts

  // Check which letters are near the cursor
  letters.forEach(letter => {
    const rect = letter.getBoundingClientRect();
    const letterCenterX = rect.left + rect.width / 2;
    const letterCenterY = rect.top + rect.height / 2;

    const distance = Math.sqrt(
      Math.pow(e.clientX - letterCenterX, 2) +
      Math.pow(e.clientY - letterCenterY, 2)
    );

    if (distance < 120) {
      if (!letter.classList.contains('visible')) {
        letter.classList.add('visible', 'blue-pulse');
        checkAllRevealed();
      }
    }
  });
});

// --- Check if all letters revealed ---
function checkAllRevealed() {
  if (allRevealed) return;

  const visibleCount = document.querySelectorAll('.letter.visible').length;
  if (visibleCount === letters.length) {
    allRevealed = true;
    // Wait a moment, then start the typewriter effect
    setTimeout(startConciergeMode, 1500);
  }
}

// --- Start Concierge Mode ---
function startConciergeMode() {
  if (conciergeStarted) return;
  conciergeStarted = true;

  // Start the liminal veil video collage when concierge starts
  window.veilStarted = true;

  // Show cursor
  cursor.style.display = 'inline-block';

  // Start backspacing
  backspaceTitle();
}

// --- Backspace the title letter by letter ---
function backspaceTitle() {
  const visibleLetters = Array.from(letters).filter(l => l.style.display !== 'none');
  let index = visibleLetters.length - 1;

  function deleteNext() {
    if (index >= 0) {
      visibleLetters[index].style.display = 'none';
      index--;
      setTimeout(deleteNext, 80 + Math.random() * 60); // Slightly random timing
    } else {
      // All deleted, switch to concierge mode
      setTimeout(typeConciergeMessage, 400);
    }
  }

  deleteNext();
}

// --- Type the concierge message ---
async function typeConciergeMessage() {
  // Clear the wordmark and switch style
  wordmark.innerHTML = '<span class="typewriter-text" id="typewriter-text"></span>';
  wordmark.classList.add('concierge-mode');

  const typewriterText = document.getElementById('typewriter-text');

  // Fetch greeting from API with timeout, or use fallback
  let message = conciergeMessages[Math.floor(Math.random() * conciergeMessages.length)];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`${window.CONCIERGE_API_URL}/greeting`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.greeting) {
        message = data.greeting;
      }
    }
  } catch (e) {
    console.log('Using fallback greeting:', e.message || 'API unavailable');
  }

  await typeText(typewriterText, message);

  // Show input bar after greeting
  setTimeout(showInputBar, 800);
}

// --- Typewriter helper (fast) ---
function typeText(element, text) {
  return new Promise(resolve => {
    let charIndex = 0;
    function typeNext() {
      if (charIndex < text.length) {
        element.textContent += text[charIndex];
        charIndex++;
        const delay = text[charIndex - 1] === ' ' ? 50 : (25 + Math.random() * 25);
        setTimeout(typeNext, delay);
      } else {
        resolve();
      }
    }
    typeNext();
  });
}

// --- Fade out helper (replaces backspace for messages) ---
function fadeOutText(element) {
  return new Promise(resolve => {
    element.classList.add('fade-out');
    setTimeout(() => {
      element.textContent = '';
      element.classList.remove('fade-out');
      resolve();
    }, 400);
  });
}

// --- Helper: display a message via the typewriter display ---
async function typewriterDisplay(message) {
  const wordmark = document.getElementById('wordmark');
  if (!wordmark) return;
  if (!wordmark.classList.contains('concierge-mode')) {
    wordmark.classList.add('concierge-mode');
    wordmark.innerHTML = '<span class="typewriter-text" id="typewriter-text"></span>';
  }
  const el = document.getElementById('typewriter-text');
  if (!el) return;
  await fadeOutText(el);
  await typeText(el, message);
}

// --- Backspace helper ---
function backspaceText(element) {
  return new Promise(resolve => {
    function deleteNext() {
      if (element.textContent.length > 0) {
        element.textContent = element.textContent.slice(0, -1);
        setTimeout(deleteNext, 40 + Math.random() * 30);
      } else {
        resolve();
      }
    }
    deleteNext();
  });
}

// --- Show input bar ---
let idleHintTimer = null;

function showInputBar() {
  const inputBar = document.getElementById('input-bar');
  const userInput = document.getElementById('user-input');
  inputBar.classList.add('visible');
  userInput.focus({ preventScroll: true });

  // Reset idle timer
  resetIdleHint();
}

function resetIdleHint() {
  const userInput = document.getElementById('user-input');
  clearTimeout(idleHintTimer);

  idleHintTimer = setTimeout(() => {
    if (userInput.value === '' && document.getElementById('input-bar').classList.contains('visible')) {
      // Briefly show the placeholder by triggering re-animation
      userInput.style.animation = 'none';
      userInput.offsetHeight; // Trigger reflow
      userInput.style.animation = '';
    }
  }, 5000);
}

// Reset timer on any input activity
document.getElementById('user-input').addEventListener('input', resetIdleHint);
document.getElementById('user-input').addEventListener('focus', resetIdleHint);

// --- Hide input bar ---
function hideInputBar() {
  const inputBar = document.getElementById('input-bar');
  inputBar.classList.remove('visible');
  clearTimeout(idleHintTimer);
}

// --- Handle user input ---
const conversationHistory = [];

// --- Handle action responses from concierge ---
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.style.cssText = `
        position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
        background: ${type === 'error' ? 'rgba(200,80,80,0.9)' : 'rgba(41,98,255,0.85)'};
        color: white; padding: 10px 22px; border-radius: 24px;
        font-family: 'Orbitron', sans-serif; font-size: 12px; letter-spacing: 0.08em;
        z-index: 9999; pointer-events: none;
        animation: toastIn 0.3s ease forwards;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function handleAction(action) {
  if (!action) return;

  switch (action.action) {
    case 'navigate':
      const baseUrl = window.location.origin;
      const url = action.url.startsWith('/') ? baseUrl + action.url : action.url;
      window.open(url, '_blank');
      break;

    case 'email_sent':
      showToast('✉ Message sent successfully');
      break;

    case 'email_drafted':
      showToast('✉ Draft saved to Gmail — review before sending');
      break;

    case 'event_created':
      showToast('📅 Event added to calendar');
      if (action.event_link) {
        setTimeout(() => window.open(action.event_link, '_blank'), 800);
      }
      break;

    case 'availability': {
      // Append availability as a concierge follow-up message
      const slots = action.formatted || 'No available slots found.';
      const msg = `Available on ${action.date}:\n${slots}`;
      typewriterDisplay(msg);
      break;
    }

    case 'info':
      // Formatted info (pages list, project list, etc.)
      if (action.formatted) typewriterDisplay(action.formatted);
      break;

    case 'auth_required':
      showToast('🔒 ' + (action.message || 'Authentication required'), 'error');
      typewriterDisplay('This action requires verification — are you the owner?');
      break;

    case 'not_found':
      showToast('🔍 ' + (action.message || 'Not found'), 'error');
      break;

    case 'error':
      showToast('⚠ ' + (action.message || 'Something went wrong'), 'error');
      console.error('Tool error:', action.message);
      break;

    default:
      console.log('Unknown action response:', action);
  }
}



document.getElementById('user-input').addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();
    if (!message) return;

    // --- SECRET ACTIVATION: Thinker Scene ---
    if (message.toLowerCase() === 'thinker' || message.toLowerCase() === 'open thinker') {
      userInput.value = '';
      hideInputBar();

      // Open 3D scene in small popup window
      window.open('thinker.html', 'ThinkerScene', 'width=800,height=600,resizable=yes');
      return;
    }

    userInput.value = '';
    hideInputBar();

    const typewriterText = document.getElementById('typewriter-text');

    // Fade out current text
    await fadeOutText(typewriterText);

    // Show brief pulsing cursor instead of dots
    typewriterText.textContent = '';
    typewriterText.classList.add('thinking'); /* Fast blink for thinking */
    conversationHistory.push({ role: 'user', content: message });

    // Get AI response with timeout
    let responseData;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for chat

      const res = await fetch(`${window.CONCIERGE_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversation_history: conversationHistory.slice(-10),
          user_context: userMemory.getContext()
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        responseData = await res.json();
        console.log("concierge response:", responseData); // DEBUG LOG

        // Update memory if provided in response
        if (responseData.user_context_update && responseData.user_context_update.user_name) {
          userMemory.setName(responseData.user_context_update.user_name);
        }
      } else {
        responseData = { type: 'text', narration: "hmm, something's off. try again in a sec?" };
      }
    } catch (e) {
      console.log('Chat error:', e.message || 'API unavailable');
      responseData = { type: 'text', narration: "hmm, something's off. try again in a sec?" };
    }



    // --- RESPONSE HANDLER ---
    await fadeOutText(typewriterText);

    // Handle any actions from tools
    if (responseData.action) {
      handleAction(responseData.action);
    }



    // Restore normal blink
    typewriterText.classList.remove('thinking');

    // Handle text response
    await typeText(typewriterText, responseData.narration || responseData.response || '...');

    conversationHistory.push({ role: 'assistant', content: responseData.narration || '' });

    // Show input again
    setTimeout(showInputBar, 800);
  }
});

// ============================================
// ANIMATION & INTERACTIVE ELEMENTS (PLACEHOLDER)
// Future developed animations will be integrated here
// ============================================


// --- Interactive Elements Placeholder ---
// (Rain logic moved to background_elements.js Three.js scene)

// --- Dev Sandbox Toggle ---
const sandboxToggle = document.getElementById('sandbox-toggle');
const wordmarkContainer = document.querySelector('.wordmark-container');
const veilCanvas = document.getElementById('veil-canvas');
let sandboxEnabled = false;

if (sandboxToggle) {
  sandboxToggle.addEventListener('click', () => {
    sandboxEnabled = !sandboxEnabled;
    window.sandboxEnabled = sandboxEnabled;

    if (sandboxEnabled) {
      sandboxToggle.textContent = 'Sandbox: ON';
      wordmarkContainer.style.opacity = '0';
      wordmarkContainer.style.pointerEvents = 'none';
      document.getElementById('input-bar').style.opacity = '0';
      document.getElementById('input-bar').style.pointerEvents = 'none';
    } else {
      sandboxToggle.textContent = 'Sandbox: OFF';
      wordmarkContainer.style.opacity = '1';
      wordmarkContainer.style.pointerEvents = 'auto';
      if (conciergeStarted) {
        document.getElementById('input-bar').style.opacity = '1';
        document.getElementById('input-bar').style.pointerEvents = 'auto';
      }
    }

    sandboxToggle.style.opacity = '1';
    setTimeout(() => sandboxToggle.style.opacity = '0.2', 2000);
  });

  // Hover effect
  sandboxToggle.addEventListener('mouseenter', () => sandboxToggle.style.opacity = '1');
  sandboxToggle.addEventListener('mouseleave', () => {
    if (!sandboxEnabled) sandboxToggle.style.opacity = '0.2';
  });
}

// --- Dev Sandbox Veil Configuration ---
window.veilConfig = { block: 7, lift: 155, desat: 0.6, maxOp: 0.45, zoomX: 1.0, zoomY: 1.0 };

if (document.getElementById('sandbox-controls')) {
  const controls = document.getElementById('sandbox-controls');
  const inputs = {
    block: document.getElementById('ctrl-block'),
    lift: document.getElementById('ctrl-lift'),
    desat: document.getElementById('ctrl-sat'),
    op: document.getElementById('ctrl-op'),
    zx: document.getElementById('ctrl-zx'),
    zy: document.getElementById('ctrl-zy')
  };
  const vals = {
    block: document.getElementById('val-block'),
    lift: document.getElementById('val-lift'),
    desat: document.getElementById('val-sat'),
    op: document.getElementById('val-op'),
    zx: document.getElementById('val-zx'),
    zy: document.getElementById('val-zy')
  };



  function updateConfig() {
    window.veilConfig.block = parseInt(inputs.block.value);
    window.veilConfig.lift = parseInt(inputs.lift.value);
    window.veilConfig.desat = parseFloat(inputs.desat.value);
    window.veilConfig.maxOp = parseFloat(inputs.op.value);
    window.veilConfig.zoomX = parseFloat(inputs.zx.value);
    window.veilConfig.zoomY = parseFloat(inputs.zy.value);

    vals.block.textContent = window.veilConfig.block;
    vals.lift.textContent = window.veilConfig.lift;
    vals.desat.textContent = window.veilConfig.desat.toFixed(1);
    vals.op.textContent = window.veilConfig.maxOp.toFixed(2);
    vals.zx.textContent = window.veilConfig.zoomX.toFixed(2);
    vals.zy.textContent = window.veilConfig.zoomY.toFixed(2);
  }

  Object.values(inputs).forEach(input => {
    input.addEventListener('input', updateConfig);
  });
}

console.log('✦ Cherenkov — liminal mode');
console.log('✦ Font: Orbitron (Google Fonts)');
