/**
 * Socrates Widget — LMS overlay AI assistant.
 *
 * Built with Lit web-components.  The key addition here is native handling of
 * the `navigate_lms` action type: when the backend resolves an LMS URL the
 * widget redirects the student directly rather than emitting a custom event.
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

interface ActionPayload {
  type: string;
  payload?: {
    url?: string;
    title?: string;
    [key: string]: unknown;
  };
}

interface BotResponse {
  type: 'text' | 'action';
  narration: string;
  action?: ActionPayload | null;
}

interface Message {
  role: 'user' | 'bot';
  text: string;
}

@customElement('socrates-widget')
export class SocratesWidget extends LitElement {
  /** Backend endpoint that returns BotResponse JSON. */
  @property({ type: String }) endpoint = '/agent/command';

  /** LTI course id injected at launch. */
  @property({ type: String, attribute: 'course-id' }) courseId = '';

  @state() private messages: Message[] = [];
  @state() private inputText = '';
  @state() private processing = false;

  // ----------------------------------------------------------------
  // Action dispatch
  // ----------------------------------------------------------------

  /**
   * Process a BotResponse from the backend.
   *
   * `navigate_lms` is handled in-page via `window.location.href`.
   * All other action types are emitted as a custom `action` event so the
   * embedding page can handle them however it likes.
   */
  private handleBotResponse(result: BotResponse): void {
    // Always show the narration text in chat
    if (result.narration) {
      this.addMessage('bot', result.narration);
    }

    if (result.action?.type === 'navigate_lms' && result.action.payload?.url) {
      // Redirect the student to the LMS page
      window.location.href = result.action.payload.url;
    } else if (result.action) {
      // Emit other actions for the host page to handle
      this.dispatchEvent(
        new CustomEvent('action', {
          detail: result.action,
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  // ----------------------------------------------------------------
  // Chat logic
  // ----------------------------------------------------------------

  private addMessage(role: Message['role'], text: string): void {
    this.messages = [...this.messages, { role, text }];
    this.updateComplete.then(() => {
      const chat = this.shadowRoot?.querySelector('.chat-area');
      if (chat) chat.scrollTop = chat.scrollHeight;
    });
  }

  private async handleSend(): Promise<void> {
    const text = this.inputText.trim();
    if (!text) return;

    this.inputText = '';
    this.addMessage('user', text);
    this.processing = true;

    try {
      const resp = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'navigate',
          course_id: this.courseId,
          query: text,
        }),
      });

      if (!resp.ok) throw new Error(`Server error ${resp.status}`);

      const result: BotResponse = await resp.json();
      this.handleBotResponse(result);
    } catch (err) {
      this.addMessage('bot', 'Something went wrong. Please try again.');
    } finally {
      this.processing = false;
    }
  }

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------

  static styles = css`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
        Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      --primary: #4f46e5;
      --bg: #ffffff;
      --text: #0f172a;
      --text-light: #64748b;
      --border: #e2e8f0;
    }
    .widget {
      width: 360px;
      height: 500px;
      background: var(--bg);
      border-radius: 16px;
      box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.15);
      border: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .header {
      padding: 16px;
      border-bottom: 1px solid #f8fafc;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .avatar {
      width: 28px;
      height: 28px;
      background: var(--primary);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
    }
    .header-text h3 {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--text);
    }
    .header-text p {
      margin: 0;
      font-size: 11px;
      color: var(--text-light);
    }
    .chat-area {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .chat-area::-webkit-scrollbar {
      display: none;
    }
    .message {
      padding: 8px 12px;
      border-radius: 10px;
      font-size: 13px;
      line-height: 1.5;
      max-width: 88%;
      animation: fadeIn 0.3s ease;
    }
    .bot {
      background: var(--bg);
      color: var(--text);
      border: 1px solid var(--border);
      border-top-left-radius: 2px;
      align-self: flex-start;
    }
    .user {
      background: var(--primary);
      color: white;
      border-top-right-radius: 2px;
      align-self: flex-end;
    }
    .input-area {
      padding: 12px 16px;
      border-top: 1px solid var(--border);
      display: flex;
      gap: 8px;
    }
    input {
      flex: 1;
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 13px;
      outline: none;
      color: var(--text);
    }
    input:focus {
      border-color: var(--primary);
    }
    button {
      background: var(--text);
      color: white;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    button:hover {
      background: var(--primary);
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;

  render() {
    return html`
      <div class="widget">
        <div class="header">
          <div class="avatar">S</div>
          <div class="header-text">
            <h3>Socrates</h3>
            <p>Symposium Connector</p>
          </div>
        </div>

        <div class="chat-area">
          ${this.messages.map(
            (m) =>
              html`<div class="message ${m.role}">${m.text}</div>`,
          )}
          ${this.processing
            ? html`<div class="message bot" style="width:40px;display:flex;gap:4px;align-items:center;justify-content:center">
                <span style="width:4px;height:4px;background:#94a3b8;border-radius:50%;animation:bounce 1s infinite"></span>
                <span style="width:4px;height:4px;background:#94a3b8;border-radius:50%;animation:bounce 1s infinite .2s"></span>
                <span style="width:4px;height:4px;background:#94a3b8;border-radius:50%;animation:bounce 1s infinite .4s"></span>
              </div>`
            : ''}
        </div>

        <div class="input-area">
          <input
            type="text"
            .value=${this.inputText}
            @input=${(e: Event) =>
              (this.inputText = (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) =>
              e.key === 'Enter' && this.handleSend()}
            placeholder="Ask about your course..."
          />
          <button
            @click=${this.handleSend}
            ?disabled=${!this.inputText.trim()}
          >
            &#8593;
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'socrates-widget': SocratesWidget;
  }
}
