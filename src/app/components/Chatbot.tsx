import React, { useState, useRef } from 'react';
import { MessageSquare, X, Send, Upload, FileText, Settings } from 'lucide-react';
import { askChatbot } from '../../services/ai-quiz';
import { SettingsModal } from '../../components/SettingsModal';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'bot', text: string}[]>([
    { role: 'bot', text: 'Hi! Ask me anything about the 2026 World Cup, football rules, or player stats.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    let rawUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
    
    // Clean up the URL: remove leading/trailing slashes and any trailing /upload
    rawUrl = rawUrl.replace(/^\/+/, '').replace(/\/+$/, '').replace(/\/upload$/, '');
    
    if (rawUrl && !rawUrl.startsWith('http')) {
      rawUrl = 'https://' + rawUrl;
    }
    const baseUrl = rawUrl;

    try {
      const res = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: `Docling parsed **${file.name}**! I now have it in my memory. What do you want to know about it?` }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'bot', text: `Sorry, failed to upload or parse ${file.name}. Is the Python backend running?` }]);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

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
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform z-50 overflow-hidden border-2 border-red-600 bg-[#0d1133]"
        >
          <img src="/chatbot.png" alt="Chatbot" className="w-full h-full object-cover" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 h-[450px] bg-[#0d1133] rounded-2xl border border-white/10 shadow-2xl flex flex-col z-50 overflow-hidden font-['Barlow']">
          <div className="flex items-center justify-between p-4 bg-red-600">
            <h3 className="text-white font-bold font-['Teko'] text-xl">Pitch IQ Assistant</h3>
            <div className="flex items-center gap-3">
              <input 
                type="file" 
                accept=".pdf" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="text-white/80 hover:text-white transition-colors relative" 
                title="Upload PDF (Docling)"
              >
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Upload size={18} />
                )}
              </button>
              <button onClick={() => setIsSettingsOpen(true)} className="text-white/80 hover:text-white transition-colors" title="Settings">
                <Settings size={18} />
              </button>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
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

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
