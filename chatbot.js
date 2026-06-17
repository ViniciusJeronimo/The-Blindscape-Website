(function () {
  // ── CONFIG ──────────────────────────────────────────────────────────────────
  const WEBHOOK_URL = 'https://hook.eu2.make.com/gj63i9h4r6hdv7itv1hxyb1k11kf7b7x';
  const BRAND = { dark: '#171411', gold: '#d9a441', cream: '#f5f0e8', text: '#574d43' };

  const SYSTEM_PROMPT = `You are a friendly and knowledgeable assistant for The Blindscape, a Perth-based window furnishings business. You help customers choose the right blinds, shutters, curtains and outdoor solutions for their home or investment property.

Your goals:
1. Answer questions about products (roller blinds, vertical blinds, venetians, plantation shutters, curtains, outdoor blinds)
2. Give honest, helpful advice about what suits different rooms and budgets
3. Mention that The Blindscape offers FREE measure and quote with no obligation
4. Highlight that pricing is competitive — better than most Perth suppliers
5. Mention tenant coordination service when talking to property managers or real estate agents
6. After helping with 1-2 questions, naturally ask for their name, email and suburb so you can follow up with a personalised quote

When collecting lead details, ask for:
- Name
- Email address  
- Suburb
- What they're interested in

Keep responses concise, warm and helpful. Never make up specific prices — say pricing depends on size and style and a free measure and quote will give them an exact figure. Always end responses with a helpful next step.`;

  // ── STATE ───────────────────────────────────────────────────────────────────
  let messages = [];
  let isOpen = false;
  let isTyping = false;
  let leadCaptured = false;
  let leadData = {};

  // ── BUILD UI ─────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #tbs-chat-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 56px; height: 56px; border-radius: 50%;
      background: ${BRAND.gold}; border: none; cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.18);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #tbs-chat-btn:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(0,0,0,0.22); }
    #tbs-chat-btn svg { width: 26px; height: 26px; fill: #fff; }
    #tbs-chat-bubble {
      position: fixed; bottom: 90px; right: 24px; z-index: 9998;
      width: 340px; max-width: calc(100vw - 48px);
      background: #fff; border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.16);
      display: none; flex-direction: column; overflow: hidden;
      font-family: 'Inter', 'Helvetica Neue', sans-serif;
      animation: tbs-slide-up 0.25s ease;
    }
    @keyframes tbs-slide-up {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    #tbs-chat-header {
      background: ${BRAND.dark}; color: #fff;
      padding: 14px 16px; display: flex; align-items: center; gap: 10px;
    }
    #tbs-chat-header img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
    #tbs-chat-header-text { flex: 1; }
    #tbs-chat-header-name { font-weight: 600; font-size: 14px; }
    #tbs-chat-header-status { font-size: 11px; color: ${BRAND.gold}; margin-top: 1px; }
    #tbs-chat-close { background: none; border: none; color: #fff; cursor: pointer; font-size: 20px; padding: 0; line-height: 1; opacity: 0.7; }
    #tbs-chat-close:hover { opacity: 1; }
    #tbs-chat-messages {
      flex: 1; overflow-y: auto; padding: 16px; display: flex;
      flex-direction: column; gap: 10px; max-height: 340px; min-height: 200px;
    }
    .tbs-msg { max-width: 82%; display: flex; flex-direction: column; }
    .tbs-msg.bot { align-self: flex-start; }
    .tbs-msg.user { align-self: flex-end; }
    .tbs-msg-bubble {
      padding: 10px 13px; border-radius: 14px; font-size: 13.5px; line-height: 1.5;
    }
    .tbs-msg.bot .tbs-msg-bubble { background: ${BRAND.cream}; color: ${BRAND.dark}; border-bottom-left-radius: 4px; }
    .tbs-msg.user .tbs-msg-bubble { background: ${BRAND.gold}; color: #fff; border-bottom-right-radius: 4px; }
    .tbs-typing { display: flex; gap: 4px; align-items: center; padding: 10px 13px; background: ${BRAND.cream}; border-radius: 14px; border-bottom-left-radius: 4px; width: fit-content; }
    .tbs-typing span { width: 6px; height: 6px; background: ${BRAND.text}; border-radius: 50%; animation: tbs-bounce 1.2s infinite; }
    .tbs-typing span:nth-child(2) { animation-delay: 0.2s; }
    .tbs-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes tbs-bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }
    #tbs-chat-input-row {
      display: flex; gap: 8px; padding: 12px 16px;
      border-top: 1px solid #f0ece4; background: #fff;
    }
    #tbs-chat-input {
      flex: 1; border: 1px solid #e0d9ce; border-radius: 20px;
      padding: 9px 14px; font-size: 13px; outline: none;
      font-family: inherit; color: ${BRAND.dark}; resize: none;
      transition: border-color 0.2s;
    }
    #tbs-chat-input:focus { border-color: ${BRAND.gold}; }
    #tbs-chat-send {
      width: 38px; height: 38px; border-radius: 50%;
      background: ${BRAND.gold}; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: background 0.2s;
    }
    #tbs-chat-send:hover { background: #c4902e; }
    #tbs-chat-send svg { width: 16px; height: 16px; fill: #fff; }
    #tbs-chat-branding { text-align: center; padding: 6px 0 8px; font-size: 10px; color: #bbb; }
  `;
  document.head.appendChild(style);

  // Button
  const btn = document.createElement('button');
  btn.id = 'tbs-chat-btn';
  btn.setAttribute('aria-label', 'Chat with us');
  btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 10H6V10h12v2zm0-3H6V7h12v2z"/></svg>`;
  document.body.appendChild(btn);

  // Bubble
  const bubble = document.createElement('div');
  bubble.id = 'tbs-chat-bubble';
  bubble.innerHTML = `
    <div id="tbs-chat-header">
      <div style="width:36px;height:36px;border-radius:50%;background:${BRAND.gold};display:flex;align-items:center;justify-content:center;font-size:18px;">🪟</div>
      <div id="tbs-chat-header-text">
        <div id="tbs-chat-header-name">The Blindscape</div>
        <div id="tbs-chat-header-status">● Online — typically replies instantly</div>
      </div>
      <button id="tbs-chat-close" aria-label="Close chat">✕</button>
    </div>
    <div id="tbs-chat-messages"></div>
    <div id="tbs-chat-input-row">
      <input id="tbs-chat-input" placeholder="Ask about blinds, shutters, pricing…" autocomplete="off" />
      <button id="tbs-chat-send" aria-label="Send">
        <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
      </button>
    </div>
    <div id="tbs-chat-branding">Powered by AI · The Blindscape Perth</div>
  `;
  document.body.appendChild(bubble);

  // ── HELPERS ──────────────────────────────────────────────────────────────────
  function scrollToBottom() {
    const el = document.getElementById('tbs-chat-messages');
    el.scrollTop = el.scrollHeight;
  }

  function addMessage(role, text) {
    const el = document.getElementById('tbs-chat-messages');
    const wrapper = document.createElement('div');
    wrapper.className = `tbs-msg ${role}`;
    const b = document.createElement('div');
    b.className = 'tbs-msg-bubble';
    b.textContent = text;
    wrapper.appendChild(b);
    el.appendChild(wrapper);
    scrollToBottom();
  }

  function showTyping() {
    const el = document.getElementById('tbs-chat-messages');
    const t = document.createElement('div');
    t.className = 'tbs-msg bot';
    t.id = 'tbs-typing-indicator';
    t.innerHTML = `<div class="tbs-typing"><span></span><span></span><span></span></div>`;
    el.appendChild(t);
    scrollToBottom();
  }

  function hideTyping() {
    const t = document.getElementById('tbs-typing-indicator');
    if (t) t.remove();
  }

  async function sendToWebhook(data) {
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => fd.append(k, v || ''));
      await fetch(WEBHOOK_URL, { method: 'POST', mode: 'no-cors', body: fd });
    } catch (e) { /* silent fail */ }
  }

  function extractLeadDetails(text) {
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/(?:\+61|0)[0-9\s]{8,12}/);
    if (emailMatch) leadData.email = emailMatch[0];
    if (phoneMatch) leadData.phone = phoneMatch[0].replace(/\s/g, '');
  }

  async function askClaude(userMessage) {
    messages.push({ role: 'user', content: userMessage });
    extractLeadDetails(userMessage);

    // Check for name patterns
    const namePatterns = [/(?:i'm|i am|my name is|name's)\s+([A-Z][a-z]+)/i, /^([A-Z][a-z]+)\s+here/i];
    for (const p of namePatterns) {
      const m = userMessage.match(p);
      if (m) leadData.name = m[1];
    }

    showTyping();
    isTyping = true;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: messages
        })
      });

      const data = await response.json();
      const reply = data.content?.[0]?.text || "I'm having trouble connecting right now. Please call us on +61 415 882 099 and we'll be happy to help!";

      messages.push({ role: 'assistant', content: reply });
      hideTyping();
      addMessage('bot', reply);
      isTyping = false;

      // Check if lead details are complete and haven't been sent yet
      if (!leadCaptured && leadData.email && (leadData.name || leadData.phone)) {
        leadCaptured = true;
        await sendToWebhook({
          name: leadData.name || 'Chat visitor',
          phone: leadData.phone || '',
          email: leadData.email,
          suburb: leadData.suburb || '',
          interest: 'Chat enquiry',
          message: messages.filter(m => m.role === 'user').map(m => m.content).join(' | '),
          source: 'Website chatbot',
          submitted: new Date().toLocaleString('en-AU', { timeZone: 'Australia/Perth' })
        });
      }

    } catch (err) {
      hideTyping();
      addMessage('bot', "Sorry, I'm having trouble connecting. Please call us on +61 415 882 099 or fill in the contact form and we'll get back to you!");
      isTyping = false;
    }
  }

  // ── EVENTS ───────────────────────────────────────────────────────────────────
  btn.addEventListener('click', () => {
    isOpen = !isOpen;
    bubble.style.display = isOpen ? 'flex' : 'none';
    if (isOpen && messages.length === 0) {
      setTimeout(() => {
        addMessage('bot', "Hi there! 👋 Welcome to The Blindscape. I'm here to help you find the perfect blinds, shutters or curtains for your home. What can I help you with today?");
      }, 300);
    }
    if (isOpen) document.getElementById('tbs-chat-input').focus();
  });

  document.getElementById('tbs-chat-close').addEventListener('click', () => {
    isOpen = false;
    bubble.style.display = 'none';
  });

  async function handleSend() {
    const input = document.getElementById('tbs-chat-input');
    const text = input.value.trim();
    if (!text || isTyping) return;
    input.value = '';
    addMessage('user', text);
    await askClaude(text);
  }

  document.getElementById('tbs-chat-send').addEventListener('click', handleSend);
  document.getElementById('tbs-chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });

})();
