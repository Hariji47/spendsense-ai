import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Lock } from 'lucide-react';
import { sendChatMessage, getSettings } from '../services/api';
import { Link } from 'react-router-dom';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your SpendSense AI Assistant. How can I help you manage your finances today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [tier, setTier] = useState('free');
  const [aiCredits, setAiCredits] = useState(0);
  const messagesEndRef = useRef(null);

  const loadAccess = async () => {
    try {
      const res = await getSettings();
      const userTier = res.data.tier;
      setTier(userTier);
      setAiCredits(res.data.ai_credits);
      if (userTier !== 'free') {
        setHasAccess(true);
      }
    } catch (err) {}
  };

  useEffect(() => {
    loadAccess();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e, forcedText = null) => {
    if (e) e.preventDefault();
    const textToSend = forcedText || input;
    
    if (!textToSend.trim()) return;

    const newMsg = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(textToSend);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
      if (tier === 'pro') setAiCredits(prev => Math.max(0, prev - 1));
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting to the server.' }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Am I over budget this month?",
    "What are my recurring subscriptions?",
    "Analyze my spending habits.",
    "Forecast my expenses next month."
  ];

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-primary to-purple-600 text-white p-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.4)] transition-all transform hover:-translate-y-1 z-40 animate-bounce hover:animate-none"
      >
        <MessageSquare size={28} />
      </button>

      {/* Side Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Side Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-purple-600 text-white p-6 flex justify-between items-center shadow-md relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          <div className="flex items-center space-x-3 relative z-10">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Bot size={28} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-xl leading-tight">SpendSense AI</h3>
                {tier === 'pro' && (
                  <span className="bg-purple-900/50 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-400/30">
                    {aiCredits} Credits
                  </span>
                )}
                {tier === 'max' && (
                  <span className="bg-emerald-900/50 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                    ∞ Unlimited
                  </span>
                )}
              </div>
              <p className="text-white/80 text-xs font-medium">Your personal financial assistant</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="relative z-10 text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/20"
          >
            <X size={24} />
          </button>
        </div>

        {!hasAccess ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900">
            <Lock size={48} className="text-gray-300 dark:text-slate-600 mb-4" />
            <h3 className="font-bold text-gray-800 dark:text-white mb-2">Pro Feature</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Upgrade to SpendSense Pro to unlock your personal AI Financial Assistant.</p>
            <Link to="/settings" onClick={() => setIsOpen(false)}>
              <button className="bg-primary hover:bg-primaryHover text-white px-6 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1">Upgrade Now</button>
            </Link>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-900/50">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white dark:bg-slate-800 text-primary border border-gray-100 dark:border-slate-700'}`}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div 
                      className={`p-4 rounded-2xl text-sm shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-primary text-white rounded-br-sm' 
                          : 'glass-panel text-gray-800 dark:text-slate-200 rounded-bl-sm border border-gray-100 dark:border-slate-700/50'
                      }`}
                    >
                      <div className="text-sm">
                        {msg.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex flex-row items-end gap-2">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-primary border border-gray-100 dark:border-slate-700 flex items-center justify-center shadow-sm">
                      <Bot size={16} />
                    </div>
                    <div className="glass-panel text-gray-800 dark:text-slate-200 p-4 rounded-2xl rounded-bl-sm border border-gray-100 dark:border-slate-700/50 flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area with Suggestions */}
            <div className="bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-10">
              
              {/* Suggestion Chips */}
              <div className="p-3 border-b border-gray-100 dark:border-slate-700/50 overflow-x-auto whitespace-nowrap flex space-x-2 scrollbar-hide">
                {suggestions.map((sug, i) => (
                  <button 
                    key={i}
                    onClick={() => handleSend(null, sug)}
                    disabled={loading}
                    className="inline-block px-3 py-1.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {sug}
                  </button>
                ))}
              </div>

              <div className="p-4">
                <form onSubmit={(e) => handleSend(e, null)} className="flex space-x-3 items-end">
                  <div className="flex-1 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-inner focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend(e, null);
                        }
                      }}
                      placeholder="Ask about your finances..."
                      className="w-full bg-transparent px-4 py-3 text-sm focus:outline-none dark:text-white resize-none h-12 max-h-32 scrollbar-hide"
                      rows="1"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="bg-gradient-to-r from-primary to-purple-600 hover:from-primaryHover hover:to-purple-700 text-white p-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex-shrink-0"
                  >
                    <Send size={20} />
                  </button>
                </form>
                <div className="text-center mt-3">
                  <p className="text-[10px] text-slate-400 font-medium">SpendSense AI can make mistakes. Verify critical info.</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
