import { useState } from 'react';

const BOT_RESPONSES = {
  hello: 'Assalamu Alaikum! How can I help you today?',
  payment: 'We support Cash on Delivery, bKash, Nagad, and Cards at checkout.',
  delivery: 'Inside Dhaka: 1-2 days. Outside Dhaka: 2-5 days typically.',
  default: 'Thanks for reaching out. Our support team will contact you shortly.'
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: BOT_RESPONSES.hello }
  ]);
  const [input, setInput] = useState('');

  const send = () => {
    const text = input.trim();
    if (!text) return;

    let reply = BOT_RESPONSES.default;
    const normalized = text.toLowerCase();
    if (normalized.includes('payment') || normalized.includes('bkash') || normalized.includes('nagad')) reply = BOT_RESPONSES.payment;
    if (normalized.includes('delivery') || normalized.includes('shipping')) reply = BOT_RESPONSES.delivery;

    setMessages((prev) => [...prev, { from: 'user', text }, { from: 'bot', text: reply }]);
    setInput('');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-3 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="bg-orange-500 px-4 py-3 text-sm font-semibold text-white">OpenBazar Support</div>
          <div className="h-64 space-y-2 overflow-y-auto p-3 text-sm">
            {messages.map((msg, idx) => (
              <div
                key={`${msg.from}-${idx}`}
                className={`max-w-[85%] rounded-xl px-3 py-2 ${msg.from === 'bot' ? 'bg-slate-100 text-slate-700' : 'ml-auto bg-orange-500 text-white'}`}
              >
                {msg.text}
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send();
              }}
              placeholder="Type your message..."
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <button type="button" onClick={send} className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white">Send</button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-xl hover:bg-orange-600"
      >
        {open ? 'Close Chat' : 'Need Help?'}
      </button>
    </div>
  );
}
