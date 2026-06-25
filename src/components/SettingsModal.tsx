import React, { useState, useEffect } from 'react';
import { X, Save, Key, Database } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [projectId, setProjectId] = useState('');

  // Load existing from sessionStorage when opened
  useEffect(() => {
    if (isOpen) {
      setApiKey(sessionStorage.getItem('ibmApiKey') || '');
      setProjectId(sessionStorage.getItem('ibmProjectId') || '');
    }
  }, [isOpen]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('ibmApiKey', apiKey.trim());
    sessionStorage.setItem('ibmProjectId', projectId.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-['Barlow']">
      <div className="bg-[#0d1133] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-red-600">
          <h3 className="text-white font-bold font-['Teko'] text-2xl tracking-wider uppercase">AI Settings (BYOK)</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-gray-300 mb-6 leading-relaxed">
            Provide your IBM WatsonX credentials below to power the AI Assistant. These keys are <strong className="text-white">securely stored in your browser's temporary session</strong> and will be deleted as soon as you close the tab. If these keys are invalid or empty, the assistant will seamlessly fallback to our Groq Llama 70B model.
          </p>

          <form onSubmit={handleSave} className="space-y-4">
            
            {/* API Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Key size={14} /> IBM Cloud API Key
              </label>
              <input 
                type="password" 
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="••••••••••••••••••••••••"
                className="w-full bg-[#0a0d26] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono"
              />
            </div>

            {/* Project ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Database size={14} /> WatsonX Project ID
              </label>
              <input 
                type="text" 
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                placeholder="e.g. e9f7b967-fa1a-4534-9782-cb982..."
                className="w-full bg-[#0a0d26] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono"
              />
            </div>

            <button 
              type="submit" 
              className="w-full mt-6 py-3.5 rounded-xl text-white tracking-[0.1em] uppercase transition-all hover:opacity-90 flex items-center justify-center gap-2" 
              style={{background:`linear-gradient(135deg, #dc2626, #991b1b)`, fontSize:"1.05rem", fontWeight:600, fontFamily: 'Teko'}}
            >
              <Save size={18} /> Save Securely
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
}
