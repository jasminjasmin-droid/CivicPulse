import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, ArrowRight, CornerDownLeft, RefreshCw, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { aiService } from '../services/aiService';
import { ChatMessage } from '../types';

export const AiAssistantScreen: React.FC = () => {
  const { complaints, departments, currentUser, setActiveTab, setSelectedComplaintId, language } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      content: `Namaste ${currentUser.name.split(' ')[0]}! I am your **CivicPulse AI Governance Assistant**.\n\nI have direct access to city grievance records, real-time SLA escalation timers, and department scorecards.\n\nHow can I assist your civic grievance today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        { label: 'Why is my road delayed?', actionType: 'navigate', payload: 'ask_road' },
        { label: 'Who is handling my complaint?', actionType: 'navigate', payload: 'ask_who' },
        { label: 'Show nearby issues', actionType: 'navigate', payload: 'nearby' },
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: 'msg-user-' + Date.now(),
      sender: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      const reply = await aiService.getAiAssistantReply(query, complaints, departments, currentUser.ward);

      const assistantMsg: ChatMessage = {
        id: 'msg-ai-' + Date.now(),
        sender: 'assistant',
        content: reply.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: reply.actions,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = (action: { label: string; actionType: string; payload?: string }) => {
    if (action.actionType === 'view_complaint' && action.payload) {
      setSelectedComplaintId(action.payload);
      setActiveTab('track');
    } else if (action.actionType === 'navigate' && action.payload) {
      if (action.payload === 'nearby') setActiveTab('nearby');
      else if (action.payload === 'report') setActiveTab('report');
      else if (action.payload === 'track') setActiveTab('track');
      else if (action.payload === 'trust') setActiveTab('trust');
      else if (action.payload === 'ask_road') handleSendMessage("Why isn't my road repaired?");
      else if (action.payload === 'ask_who') handleSendMessage("Who is handling my complaint?");
    } else if (action.actionType === 'call' && action.payload) {
      window.location.href = `tel:${action.payload}`;
    }
  };

  const QUICK_PROMPTS = [
    "Why isn't my road repaired?",
    'Who is handling my complaint?',
    'What complaints are nearby?',
    'Explain the 7-tier SLA escalation',
    'Which department has the top Trust Score?',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] sm:h-[720px] bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* AI Header */}
      <div className="p-3 bg-white dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>CivicPulse AI Officer</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </h3>
            <p className="text-[10px] text-slate-400">Context: {currentUser.ward || 'Indiranagar'}</p>
          </div>
        </div>

        <button
          onClick={() => {
            setMessages([
              {
                id: 'msg-init-' + Date.now(),
                sender: 'assistant',
                content: `Chat session reset. Ask me about your complaints, department SLAs, or local ward issues.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          title="Clear Chat"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="p-2 bg-slate-100/70 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800/60 flex gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
        {QUICK_PROMPTS.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(q)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium hover:border-blue-400 hover:text-blue-600 transition"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m) => {
          const isUser = m.sender === 'user';

          return (
            <div
              key={m.id}
              className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">
                  {/* Markdown header parsing */}
                  {m.content}
                </div>

                {/* Suggested Action Chips inside bot responses */}
                {m.suggestedActions && m.suggestedActions.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-1.5">
                    {m.suggestedActions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => handleActionClick(act)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-bold text-[10px] hover:bg-blue-100 transition shadow-2xs"
                      >
                        <span>{act.label}</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className={`text-[9px] mt-1 text-right ${
                    isUser ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none p-3 shadow-2xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce delay-150"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce delay-300"></span>
              <span className="text-[10px] text-slate-400 font-medium ml-1">
                Consulting city database...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-2.5 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about delayed roads, SLAs, or officers..."
            className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isTyping}
            className="p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold disabled:opacity-50 transition shadow-md shadow-purple-600/20 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
