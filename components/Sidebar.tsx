import React, { useState } from 'react';
import { CATEGORIES } from '../constants';
import { askRadioDJ } from '../services/geminiService';
import { ChatMessage } from '../types';

interface SidebarProps {
  onCategorySelect: (id: string) => void;
  onSearchTags: (tags: string[]) => void;
  activeCategory: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onCategorySelect, onSearchTags, activeCategory }) => {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Olá! Sou seu AI Radio DJ. O que você quer ouvir hoje?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userMsg = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    const result = await askRadioDJ(userMsg);
    
    setMessages(prev => [...prev, { role: 'model', text: result.reply }]);
    setIsTyping(false);
    
    if (result.searchTags && result.searchTags.length > 0) {
      onSearchTags(result.searchTags);
    }
  };

  return (
    <aside className="w-80 h-full flex flex-col border-r border-slate-800 bg-slate-900/50 hidden lg:flex">
      {/* Brand */}
      <div className="p-6 flex-shrink-0">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          AI Radio
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 pb-32">
        <div className="mb-6">
          <p className="px-2 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Categorias</p>
          <div className="space-y-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => onCategorySelect(cat.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === cat.id ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
            
            <div className="border-t border-slate-800 my-2 mx-2"></div>

            <button
              onClick={() => onCategorySelect('favorites')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeCategory === 'favorites' ? 'bg-red-600/20 text-red-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <span>❤️</span>
              FAVORITOS
            </button>
          </div>
        </div>

        {/* AI DJ Section */}
        <div className="mt-auto">
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">AI DJ ASSISTANT</h4>
            </div>
            
            <div className="h-32 overflow-y-auto space-y-2 mb-3 pr-1 scrollbar-thin">
              {messages.map((m, idx) => (
                <div key={idx} className={`text-[11px] p-2 rounded-lg ${m.role === 'user' ? 'bg-indigo-600/20 text-indigo-100' : 'bg-slate-700/50 text-slate-300'}`}>
                  {m.text}
                </div>
              ))}
              {isTyping && (
                <div className="text-[11px] p-2 rounded-lg bg-slate-700/50 text-slate-400 animate-pulse">
                  Pensando...
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="relative">
              <input
                type="text"
                placeholder="Mood ou estilo..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg h-8 px-3 pr-10 text-[11px] focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-400"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </button>
            </form>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;