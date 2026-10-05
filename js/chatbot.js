
document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const API_KEY = 'AIzaSyAdDfa8A0Y93Ldg7DmpqtoFWhf_qkV7diQ';
    const MODEL   = 'gemini-2.5-flash';
    const URL     = 'https://generativelanguage.googleapis.com/v1beta/models/'
                    + MODEL + ':generateContent?key=' + API_KEY;

    // Inject HTML for Chatbot
    const chatbotHTML = `
        <div id="fitness-chatbot-container">
            <button id="chatbot-toggle-btn">
                <i class="fa-solid fa-robot"></i>
            </button>
            <div id="chatbot-window" class="hidden">
                <div class="chatbot-header">
                    <div class="chatbot-title">
                        <i class="fa-solid fa-dumbbell"></i> IronCoach AI
                    </div>
                    <button id="chatbot-close-btn"><i class="fa-solid fa-times"></i></button>
                </div>
                <div class="chatbot-messages" id="chatbot-messages">
                    <div class="message bot-message">
                        Hello! I'm IronCoach, your AI fitness assistant. Ask me anything about workouts, nutrition, or plans!
                    </div>
                </div>
                <div class="chatbot-input-area">
                    <input type="text" id="chatbot-input" placeholder="Ask about fitness...">
                    <button id="chatbot-send-btn"><i class="fa-solid fa-paper-plane"></i></button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    // Elements
    const container = document.getElementById('fitness-chatbot-container');
    const toggleBtn = document.getElementById('chatbot-toggle-btn');
    const chatWindow = document.getElementById('chatbot-window');
    const closeBtn = document.getElementById('chatbot-close-btn');
    const messagesContainer = document.getElementById('chatbot-messages');
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send-btn');

    // State
    let isOpen = false;
    const history = [];

    // Event Listeners
    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);
    sendBtn.addEventListener('click', send);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') send();
    });

    function toggleChat() {
        isOpen = !isOpen;
        if (isOpen) {
            chatWindow.classList.remove('hidden');
            toggleBtn.classList.add('hidden');
            setTimeout(() => input.focus(), 100);
        } else {
            chatWindow.classList.add('hidden');
            toggleBtn.classList.remove('hidden');
        }
    }

    async function send() {
        const text = input.value.trim();
        if (!text || sendBtn.disabled) return;

        addMsg(text, 'user-message');
        input.value = '';
        setBusy(true);

        history.push({ role: 'user', parts: [{ text: text }] });

        try {
            const response = await fetch(URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: history,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024
                    }
                })
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error ? data.error.message : 'HTTP ' + response.status);
            }

            const reply = data.candidates &&
                          data.candidates[0] &&
                          data.candidates[0].content &&
                          data.candidates[0].content.parts &&
                          data.candidates[0].content.parts[0].text;

            if (!reply) throw new Error('Empty response from Gemini.');

            history.push({ role: 'model', parts: [{ text: reply }] });
            addMsg(reply, 'bot-message');

        } catch (err) {
            addMsg('Error: ' + err.message, 'bot-message error');
            console.error('Gemini error:', err);
        } finally {
            setBusy(false);
        }
    }

    function addMsg(text, type) {
        removeTyping();
        var div = document.createElement('div');
        div.className = 'message ' + type;
        var safe = text
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g,     '<em>$1</em>')
            .replace(/\n/g,            '<br>');
        div.innerHTML = safe;
        messagesContainer.appendChild(div);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function setBusy(on) {
        sendBtn.disabled = on;
        input.disabled = on;
        if (on) {
            var t = document.createElement('div');
            t.className = 'message bot-message typing';
            t.id = 'typing';
            t.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Thinking...';
            messagesContainer.appendChild(t);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } else {
            input.focus();
        }
    }

    function removeTyping() {
        var t = document.getElementById('typing');
        if (t) t.remove();
    }
});
