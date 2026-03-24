/**
 * Searchboost Chat Widget
 * Embed: <script src="https://opti.searchboost.se/searchboost-chat.js" defer></script>
 */
(function () {
  'use strict';

  const API = 'https://opti.searchboost.se';
  const SESSION_KEY = 'sb_chat_session';
  const OPEN_KEY = 'sb_chat_open';

  // ── Session ID ──────────────────────────────────────────────
  function getSessionId() {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = 'sb_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  // ── CSS ──────────────────────────────────────────────────────
  const CSS = `
    #sb-chat-btn {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 99998;
      background: linear-gradient(135deg, #e91e8c 0%, #c2185b 100%);
      color: #fff;
      border: none;
      border-radius: 50px;
      padding: 14px 22px 14px 18px;
      font-size: 14px;
      font-weight: 600;
      font-family: -apple-system, 'Inter', sans-serif;
      cursor: pointer;
      box-shadow: 0 4px 24px rgba(233,30,140,0.45);
      display: flex;
      align-items: center;
      gap: 10px;
      transition: transform 0.2s, box-shadow 0.2s;
      letter-spacing: 0.01em;
    }
    #sb-chat-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(233,30,140,0.55);
    }
    #sb-chat-btn .sb-btn-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #00e676;
      flex-shrink: 0;
      box-shadow: 0 0 6px #00e676;
      animation: sb-pulse 2s infinite;
    }
    @keyframes sb-pulse {
      0%,100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    #sb-chat-panel {
      position: fixed;
      bottom: 96px;
      right: 28px;
      z-index: 99999;
      width: 370px;
      max-width: calc(100vw - 32px);
      height: 540px;
      max-height: calc(100vh - 120px);
      background: #0d1117;
      border-radius: 18px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.07);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: -apple-system, 'Inter', sans-serif;
      transform: scale(0.95) translateY(10px);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s;
    }
    #sb-chat-panel.sb-open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }
    .sb-header {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-bottom: 1px solid rgba(255,255,255,0.07);
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .sb-header-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #e91e8c, #7c4dff);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 17px;
      flex-shrink: 0;
    }
    .sb-header-info { flex: 1; min-width: 0; }
    .sb-header-name {
      font-size: 13px;
      font-weight: 700;
      color: #fff;
      margin: 0 0 2px;
    }
    .sb-header-status {
      font-size: 11px;
      color: #00e676;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .sb-header-status::before {
      content: '';
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #00e676;
      box-shadow: 0 0 4px #00e676;
    }
    .sb-close-btn {
      background: rgba(255,255,255,0.08);
      border: none;
      color: rgba(255,255,255,0.6);
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
      flex-shrink: 0;
    }
    .sb-close-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }
    .sb-logo-tag {
      width: 100%;
      text-align: center;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.25);
      padding: 6px 0 0;
    }
    .sb-logo-tag span {
      color: #e91e8c;
    }
    .sb-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.1) transparent;
    }
    .sb-messages::-webkit-scrollbar { width: 4px; }
    .sb-messages::-webkit-scrollbar-track { background: transparent; }
    .sb-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
    .sb-msg {
      display: flex;
      gap: 8px;
      align-items: flex-end;
      animation: sb-fadein 0.25s ease;
    }
    @keyframes sb-fadein {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .sb-msg.sb-bot { justify-content: flex-start; }
    .sb-msg.sb-user { justify-content: flex-end; }
    .sb-msg-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #e91e8c, #7c4dff);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      flex-shrink: 0;
      margin-bottom: 2px;
    }
    .sb-bubble {
      max-width: 78%;
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 13.5px;
      line-height: 1.55;
      word-break: break-word;
    }
    .sb-bot .sb-bubble {
      background: #1e2433;
      color: rgba(255,255,255,0.88);
      border-bottom-left-radius: 4px;
    }
    .sb-user .sb-bubble {
      background: linear-gradient(135deg, #e91e8c 0%, #c2185b 100%);
      color: #fff;
      border-bottom-right-radius: 4px;
    }
    .sb-typing {
      display: flex;
      gap: 5px;
      padding: 12px 14px;
    }
    .sb-typing span {
      width: 7px; height: 7px;
      background: rgba(255,255,255,0.35);
      border-radius: 50%;
      animation: sb-bounce 1.3s infinite;
    }
    .sb-typing span:nth-child(2) { animation-delay: 0.15s; }
    .sb-typing span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes sb-bounce {
      0%,60%,100% { transform: translateY(0); }
      30% { transform: translateY(-5px); }
    }
    .sb-lead-form {
      background: #141b2d;
      border: 1px solid rgba(0,212,255,0.2);
      border-radius: 12px;
      padding: 14px;
      margin: 4px 0;
      animation: sb-fadein 0.3s ease;
    }
    .sb-lead-form p {
      font-size: 12px;
      color: #00d4ff;
      font-weight: 600;
      margin: 0 0 10px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .sb-lead-form input {
      width: 100%;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 8px;
      padding: 9px 12px;
      font-size: 13px;
      color: #fff;
      font-family: inherit;
      margin-bottom: 8px;
      outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    .sb-lead-form input:focus { border-color: #e91e8c; }
    .sb-lead-form input::placeholder { color: rgba(255,255,255,0.3); }
    .sb-lead-form button {
      width: 100%;
      background: linear-gradient(135deg, #e91e8c, #c2185b);
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 10px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: opacity 0.2s;
      letter-spacing: 0.02em;
    }
    .sb-lead-form button:hover { opacity: 0.9; }
    .sb-input-area {
      border-top: 1px solid rgba(255,255,255,0.07);
      padding: 12px 14px;
      display: flex;
      gap: 8px;
      background: #0d1117;
    }
    .sb-input-area input {
      flex: 1;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 13.5px;
      color: #fff;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }
    .sb-input-area input:focus { border-color: rgba(233,30,140,0.5); }
    .sb-input-area input::placeholder { color: rgba(255,255,255,0.28); }
    .sb-input-area input:disabled { opacity: 0.4; cursor: not-allowed; }
    .sb-send-btn {
      background: linear-gradient(135deg, #e91e8c, #c2185b);
      border: none;
      color: #fff;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s, transform 0.15s;
      flex-shrink: 0;
    }
    .sb-send-btn:hover:not(:disabled) { opacity: 0.9; transform: scale(1.05); }
    .sb-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .sb-send-btn svg { width: 17px; height: 17px; fill: #fff; }
    .sb-confirm {
      text-align: center;
      padding: 12px;
      animation: sb-fadein 0.3s ease;
    }
    .sb-confirm-icon { font-size: 32px; margin-bottom: 8px; }
    .sb-confirm h3 {
      font-size: 14px;
      color: #fff;
      margin: 0 0 6px;
      font-weight: 700;
    }
    .sb-confirm p {
      font-size: 12.5px;
      color: rgba(255,255,255,0.6);
      margin: 0;
      line-height: 1.55;
    }
    .sb-confirm a { color: #00d4ff; text-decoration: none; }
    @media (max-width: 480px) {
      #sb-chat-panel { right: 12px; bottom: 80px; width: calc(100vw - 24px); }
      #sb-chat-btn { right: 16px; bottom: 16px; }
    }
  `;

  // ── State ────────────────────────────────────────────────────
  let isOpen = false;
  let isLoading = false;
  let leadCaptured = false;
  let leadFormVisible = false;
  let sessionId = getSessionId();

  // ── DOM ──────────────────────────────────────────────────────
  let panel, msgContainer, inputEl, sendBtn, leadFormEl;

  function injectCSS() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function buildPanel() {
    // Floating button
    const btn = document.createElement('button');
    btn.id = 'sb-chat-btn';
    btn.innerHTML = `<span class="sb-btn-dot"></span>Gratis SEO-analys`;
    btn.addEventListener('click', togglePanel);
    document.body.appendChild(btn);

    // Chat panel
    panel = document.createElement('div');
    panel.id = 'sb-chat-panel';
    panel.innerHTML = `
      <div class="sb-header">
        <div class="sb-header-avatar">&#x26A1;</div>
        <div class="sb-header-info">
          <p class="sb-header-name">Searchboost AI</p>
          <div class="sb-header-status">Online nu</div>
        </div>
        <button class="sb-close-btn" id="sb-close">&#xD7;</button>
      </div>
      <div class="sb-messages" id="sb-messages"></div>
      <div class="sb-input-area">
        <input type="text" id="sb-input" placeholder="Skriv här..." autocomplete="off">
        <button class="sb-send-btn" id="sb-send" disabled>
          <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
        </button>
      </div>
      <div class="sb-logo-tag">Drivs av <span>Searchboost.se</span></div>
    `;
    document.body.appendChild(panel);

    msgContainer = panel.querySelector('#sb-messages');
    inputEl = panel.querySelector('#sb-input');
    sendBtn = panel.querySelector('#sb-send');

    panel.querySelector('#sb-close').addEventListener('click', togglePanel);
    inputEl.addEventListener('input', () => { sendBtn.disabled = !inputEl.value.trim() || isLoading; });
    inputEl.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
    sendBtn.addEventListener('click', sendMessage);
  }

  function togglePanel() {
    isOpen = !isOpen;
    panel.classList.toggle('sb-open', isOpen);
    if (isOpen && msgContainer.children.length === 0) {
      startConversation();
    }
    if (isOpen) setTimeout(() => inputEl.focus(), 300);
  }

  // ── Messages ─────────────────────────────────────────────────
  function addMessage(text, role) {
    const wrap = document.createElement('div');
    wrap.className = `sb-msg sb-${role}`;
    if (role === 'bot') {
      wrap.innerHTML = `<div class="sb-msg-avatar">&#x26A1;</div><div class="sb-bubble">${escHtml(text)}</div>`;
    } else {
      wrap.innerHTML = `<div class="sb-bubble">${escHtml(text)}</div>`;
    }
    msgContainer.appendChild(wrap);
    scrollBottom();
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'sb-msg sb-bot';
    el.id = 'sb-typing';
    el.innerHTML = `<div class="sb-msg-avatar">&#x26A1;</div><div class="sb-bubble sb-typing"><span></span><span></span><span></span></div>`;
    msgContainer.appendChild(el);
    scrollBottom();
  }

  function hideTyping() {
    const el = document.getElementById('sb-typing');
    if (el) el.remove();
  }

  function scrollBottom() {
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
  }

  // ── Lead Form ─────────────────────────────────────────────────
  function showLeadForm() {
    if (leadFormVisible || leadCaptured) return;
    leadFormVisible = true;

    leadFormEl = document.createElement('div');
    leadFormEl.className = 'sb-msg sb-bot';
    leadFormEl.innerHTML = `
      <div class="sb-msg-avatar">&#x26A1;</div>
      <div class="sb-lead-form">
        <p>Kostnadsfri Searchboost-analys</p>
        <input type="url" id="sb-domain" placeholder="Din domän (t.ex. dinblogg.se)">
        <input type="email" id="sb-email" placeholder="Din e-post">
        <button id="sb-lead-submit">Skicka &rarr; Mikael kontaktar dig</button>
      </div>
    `;
    msgContainer.appendChild(leadFormEl);
    scrollBottom();

    leadFormEl.querySelector('#sb-lead-submit').addEventListener('click', submitLead);
    inputEl.disabled = true;
    sendBtn.disabled = true;
  }

  async function submitLead() {
    const domain = leadFormEl.querySelector('#sb-domain').value.trim();
    const email = leadFormEl.querySelector('#sb-email').value.trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      leadFormEl.querySelector('#sb-email').style.borderColor = '#e91e8c';
      return;
    }

    const btn = leadFormEl.querySelector('#sb-lead-submit');
    btn.textContent = 'Skickar...';
    btn.disabled = true;

    try {
      await fetch(`${API}/api/chatbot/capture-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, domain, sessionId }),
      });
    } catch (_) {}

    leadCaptured = true;
    leadFormVisible = false;
    leadFormEl.remove();

    // Bekräftelse
    const conf = document.createElement('div');
    conf.className = 'sb-confirm';
    conf.innerHTML = `
      <div class="sb-confirm-icon">&#x2705;</div>
      <h3>Tack! Mikael hör av sig inom 24h.</h3>
      <p>Vi skickar din kostnadsfria SEO-analys till <strong>${escHtml(email)}</strong>.<br>
      Har du bråttom? Maila direkt: <a href="mailto:mikael@searchboost.se">mikael@searchboost.se</a></p>
    `;
    msgContainer.appendChild(conf);
    scrollBottom();

    inputEl.disabled = false;
    sendBtn.disabled = !inputEl.value.trim();
  }

  // ── API ──────────────────────────────────────────────────────
  async function startConversation() {
    showTyping();
    await sleep(700);
    hideTyping();
    addMessage('Hej! Jag är Searchboosts AI-assistent.\n\nVad kämpar du med just nu — syns sajten dåligt i Google, tappar ni trafik, eller rankar konkurrenter före dig?', 'bot');
  }

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || isLoading) return;

    addMessage(text, 'user');
    inputEl.value = '';
    sendBtn.disabled = true;
    isLoading = true;
    showTyping();

    try {
      const res = await fetch(`${API}/api/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      });
      const data = await res.json();
      hideTyping();
      addMessage(data.reply || 'Förlåt, kunde inte svara just nu.', 'bot');

      // Visa lead-formuläret om konversationen är igång (efter 2+ bot-svar)
      const botMsgs = msgContainer.querySelectorAll('.sb-msg.sb-bot').length;
      if (botMsgs >= 2 && !leadCaptured && !leadFormVisible) {
        setTimeout(showLeadForm, 800);
      }
    } catch (_) {
      hideTyping();
      addMessage('Förlåt, anslutningen bröts. Försök igen.', 'bot');
    } finally {
      isLoading = false;
      sendBtn.disabled = !inputEl.value.trim();
    }
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ── Init ─────────────────────────────────────────────────────
  function init() {
    injectCSS();
    buildPanel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
