import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, RefreshCw } from 'lucide-react';
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

  // Initial welcome message
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hi ${user?.name ? user.name.split(' ')[0] : 'there'}! I'm Attendify AI. Ask me anything about your attendance records, safe-to-miss allowances, or what-if scenarios.`,
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

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Lock background scroll on mobile when chat is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!user) {
    return null;
  }

  const suggestedPrompts = [
    'Analyze my attendance.',
    'Which subject needs attention?',
    'Show my absences this month.',
    'How many classes can I safely miss?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const rawMessage = (textToSend || input).trim();
    if (!rawMessage || isProcessing) return;

    setInput('');
    const userMsgId = Date.now().toString();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message
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
      const context = {
        subjects,
        attendance,
        warningThreshold: settings.attendanceWarningThreshold || 75,
      };

      const result = answerAttendanceQuery(rawMessage, context, activeSubject);

      if (result.subjectName) {
        const found = subjects.find(
          (s) => s.name.toLowerCase() === result.subjectName?.toLowerCase()
        );
        if (found) setActiveSubject(found);
      }

      let responseText = result.details;
      if (localAIStatus === 'ready') {
        const aiEnhanced = await synthesizeExplanation(rawMessage, result.details);
        if (aiEnhanced) {
          responseText = aiEnhanced;
        }
      }

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
          text: 'I ran into an issue retrieving that. Please try rephrasing your question.',
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
        text: 'Conversation reset. What attendance question can I answer for you?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <>
      {/* 
        Floating Action Button (FAB)
        Hidden when chat panel is open so it doesn't duplicate controls.
        Calculates position cleanly: bottom-ai-fab on mobile (above TabBar + 14px), bottom-6 right-6 on desktop.
      */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open Attendify AI"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            className="fixed bottom-ai-fab right-4 md:bottom-6 md:right-6 z-40 w-13 h-13 md:w-14 md:h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Bot className="w-6 h-6" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-primary" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 
        Chat Panel Backdrop (Mobile only)
      */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs md:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* 
        Chat Panel:
        Mobile: Bottom-sheet style pinned to bottom, max-height 80dvh, above safe area.
        Desktop: Compact card in bottom-right corner (380px wide x 540px high).
      */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col h-[78dvh] max-h-[620px] rounded-t-2xl md:inset-auto md:bottom-6 md:right-6 md:w-[390px] md:h-[530px] md:rounded-2xl bg-card border border-border shadow-2xl overflow-hidden safe-area-inset"
          >
            {/* Header: Compact ~56px */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/90 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-semibold text-sm leading-tight text-foreground">Attendify AI</h2>
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary">
                      Free
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {localAIStatus === 'ready' ? '⚡ Device On-Device AI Active' : 'Attendance Assistant'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleResetConversation}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                  title="New Chat"
                  aria-label="New Chat"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conversation Body: Scrollable flex-1 */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs overscroll-contain">
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
                    {msg.queryResult && (
                      <div className="font-bold text-[11px] text-primary mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 shrink-0" />
                        <span>{msg.queryResult.headline}</span>
                      </div>
                    )}

                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

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

                  {/* Contextual Follow-up Chips */}
                  {msg.queryResult?.suggestedFollowUps && msg.queryResult.suggestedFollowUps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {msg.queryResult.suggestedFollowUps.map((prompt, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => handleSendMessage(prompt)}
                          className="text-[10px] bg-card hover:bg-muted border border-border text-foreground px-2.5 py-1 rounded-full transition-colors font-medium text-left"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isProcessing && (
                <div className="flex items-center gap-2 text-muted-foreground bg-muted/40 px-3 py-2 rounded-xl border border-border/30 w-fit">
                  <Bot className="w-3.5 h-3.5 text-primary animate-pulse" />
                  <span className="text-[11px]">Analyzing your records...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Starter Suggestions (Only shown when beginning conversation) */}
            {messages.length <= 1 && (
              <div className="px-3.5 py-2 border-t border-border/30 bg-muted/15 shrink-0">
                <p className="text-[10px] text-muted-foreground font-medium mb-1.5">How can I help with your attendance?</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedPrompts.map((sp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(sp)}
                      className="text-[10px] bg-background hover:bg-muted border border-border/70 text-foreground px-2.5 py-1 rounded-full transition-colors font-medium text-left"
                    >
                      {sp}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar: Anchored at bottom */}
            <div className="p-3 border-t border-border bg-card shrink-0">
              <div className="relative flex items-center">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a question about your attendance..."
                  rows={1}
                  disabled={isProcessing}
                  className="w-full bg-muted/50 border border-border rounded-xl pl-3 pr-10 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none min-h-[36px] max-h-[72px]"
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || isProcessing}
                  aria-label="Send message"
                  className="absolute right-1.5 p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 disabled:hover:bg-primary transition-all shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
