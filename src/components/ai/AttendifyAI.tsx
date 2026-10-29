import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, AlertCircle, RefreshCw, ChevronDown } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { answerAttendanceQuery, QueryResult } from '@/utils/attendanceAI';
import { useLocalAI } from '@/hooks/useLocalAI';
import { Subject } from '@/types/attendance';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  queryResult?: QueryResult;
  timestamp: string;
}

export function AttendifyAI() {
  const { user } = useAuth();
  const { subjects, attendance, settings } = useApp();
  const { status: localAIStatus, synthesizeExplanation } = useLocalAI();

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeSubject, setActiveSubject] = useState<Subject | undefined>(undefined);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello ${user?.name ? user.name.split(' ')[0] : 'there'}! I'm Attendify AI, your attendance assistant. Ask me anything about your classes, bunk allowances, or attendance goals.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (!user) {
    return null; // Only available for authenticated students
  }

  const suggestedPrompts = [
    'Analyze my overall attendance.',
    'Which subject has my lowest attendance?',
    'How many classes can I safely miss?',
    'Show my absences this month.',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const rawMessage = (textToSend || input).trim();
    if (!rawMessage || isProcessing) return;

    setInput('');
    const userMsgId = Date.now().toString();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Append user message
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: rawMessage,
        timestamp,
      },
    ]);

    setIsProcessing(true);

    try {
      // 2. Deterministic attendance analytics query
      const context = {
        subjects,
        attendance,
        warningThreshold: settings.attendanceWarningThreshold || 75,
      };

      const result = answerAttendanceQuery(rawMessage, context, activeSubject);

      // Track conversational subject context for follow-up questions
      if (result.subjectName) {
        const found = subjects.find(
          (s) => s.name.toLowerCase() === result.subjectName?.toLowerCase()
        );
        if (found) setActiveSubject(found);
      }

      // 3. Natural language enhancement via browser-local AI where supported
      let responseText = result.details;
      if (localAIStatus === 'ready') {
        const aiEnhanced = await synthesizeExplanation(rawMessage, result.details);
        if (aiEnhanced) {
          responseText = aiEnhanced;
        }
      }

      // 4. Append assistant response
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: responseText,
          queryResult: result,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('Attendify AI query error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: 'I ran into an issue processing that query. Please try asking again or rephrase your question.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetConversation = () => {
    setActiveSubject(undefined);
    setMessages([
      {
        id: Date.now().toString(),
        sender: 'assistant',
        text: 'Conversation reset. What would you like to check regarding your attendance?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <motion.button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open Attendify AI"
        aria-expanded={isOpen}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.93 }}
        className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close-icon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="bot-icon"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <Bot className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-background" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Conversational Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-x-3 bottom-24 top-16 md:inset-auto md:bottom-24 md:right-6 md:w-[410px] md:h-[580px] z-50 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-semibold text-sm leading-tight text-foreground">Attendify AI</h2>
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-primary/10 text-primary">
                      Free
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {localAIStatus === 'ready' ? '⚡ Device On-Device AI Active' : 'Verified Attendance Analytics'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleResetConversation}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                  title="Reset conversation"
                  aria-label="Reset conversation"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                  aria-label="Close chat panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 ${
                      msg.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-xs'
                        : 'bg-muted/70 text-foreground border border-border/50 rounded-bl-xs'
                    }`}
                  >
                    {/* Assistant Headline Card */}
                    {msg.queryResult && (
                      <div className="font-bold text-[11px] text-primary mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 shrink-0" />
                        <span>{msg.queryResult.headline}</span>
                      </div>
                    )}

                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                    {/* Bullet Points / Breakdown Details */}
                    {msg.queryResult?.bulletPoints && msg.queryResult.bulletPoints.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/40 space-y-1 text-[11px]">
                        {msg.queryResult.bulletPoints.map((bp, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-muted-foreground">
                            <span className="text-primary font-bold">•</span>
                            <span className="text-foreground">{bp}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-0.5 px-1">{msg.timestamp}</span>

                  {/* Follow-up Prompts */}
                  {msg.queryResult?.suggestedFollowUps && msg.queryResult.suggestedFollowUps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.queryResult.suggestedFollowUps.map((prompt, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => handleSendMessage(prompt)}
                          className="text-[10px] bg-background hover:bg-muted border border-border text-foreground px-2 py-1 rounded-full transition-colors font-medium text-left"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isProcessing && (
                <div className="flex items-center gap-2 text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border/30 w-fit">
                  <Bot className="w-3.5 h-3.5 text-primary animate-pulse" />
                  <span className="text-[11px]">Analyzing your records...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Starter Prompts */}
            {messages.length <= 2 && (
              <div className="px-3 py-1.5 border-t border-border/40 bg-muted/20">
                <p className="text-[10px] text-muted-foreground mb-1 font-medium">Suggested questions:</p>
                <div className="flex flex-wrap gap-1">
                  {suggestedPrompts.map((sp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(sp)}
                      className="text-[10px] bg-background hover:bg-muted border border-border px-2 py-0.5 rounded-full text-foreground transition-colors"
                    >
                      {sp}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 border-t border-border bg-card/60">
              <div className="relative flex items-center">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your attendance (e.g. 'Can I skip IP tomorrow?')..."
                  rows={1}
                  disabled={isProcessing}
                  className="w-full bg-muted/50 border border-border rounded-xl pl-3 pr-10 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none min-h-[38px] max-h-[80px]"
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isProcessing}
                  aria-label="Send message"
                  className="absolute right-1.5 p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:hover:bg-primary transition-all shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[9px] text-center text-muted-foreground mt-1.5">
                Press Enter to send • 100% Free • Private device inference
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
