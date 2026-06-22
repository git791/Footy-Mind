import React, { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';
import { askChatbot } from '../../services/ai-quiz';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'bot', text: string}[]>([
    { role: 'bot', text: 'Hi! Ask me anything about the 2026 World Cup, football rules, or player stats.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      // In a real app, you would pass the full history or use Langflow's session ID
      const reply = await askChatbot(userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, my connection to the stadium is fuzzy right now. Try again!' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform z-50"
        >
          <MessageSquare color="white" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 h-[450px] bg-[#0d1133] rounded-2xl border border-white/10 shadow-2xl flex flex-col z-50 overflow-hidden font-['Barlow']">
          <div className="flex items-center justify-between p-4 bg-red-600">
            <h3 className="text-white font-bold font-['Teko'] text-xl">Pitch IQ Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white/10 text-gray-200 rounded-bl-none'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 text-gray-400 p-3 rounded-xl rounded-bl-none text-sm flex gap-1">
                  <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-3 bg-[#0a0d26] border-t border-white/5 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
            />
            <button type="submit" disabled={!input.trim() || loading} className="w-10 h-10 bg-red-600 hover:bg-red-500 rounded-lg flex items-center justify-center disabled:opacity-50 transition-colors">
              <Send size={16} color="white" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
