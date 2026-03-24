'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, ChevronDown } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useGarden } from '@/lib/hooks';
import { AiAdvisorLocked } from './ai-advisor-locked';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS_EN = [
  'When should I plant tomatoes? 🍅',
  'My basil leaves are turning yellow 🌿',
  'Best companion plants for carrots? 🥕',
  'How do I make compost at home? ♻️',
  'How often should I water my garden? 💧',
  'Which plants grow well in the shade? 🌑',
  'How do I deal with aphids naturally? 🐛',
  'What are the best plants for spring? 🌸',
];

const SUGGESTED_QUESTIONS_FR = [
  'Quand planter des tomates ? 🍅',
  'Mes feuilles de basilic jaunissent 🌿',
  'Meilleures associations pour les carottes ? 🥕',
  'Comment faire du compost maison ? ♻️',
  'À quelle fréquence arroser mon potager ? 💧',
  'Quelles plantes poussent bien à l\'ombre ? 🌑',
  'Comment lutter contre les pucerons naturellement ? 🐛',
  'Quelles plantes pour le printemps ? 🌸',
];

const FOLLOW_UP_QUESTIONS_EN: Record<string, string[]> = {
  planting: ['When to start seeds indoors? 🌱', 'Best soil mix for seedlings? 🪴', 'How deep should I plant? 📏'],
  pests: ['What about slugs? 🐌', 'Natural pesticide recipes? 🧪', 'How to attract beneficial insects? 🐝'],
  soil: ['How to test my soil pH? 🧪', 'Best compost ratio? ♻️', 'When to add mulch? 🍂'],
  watering: ['Drip irrigation tips? 💧', 'Signs of overwatering? 🚿', 'Best time of day to water? ☀️'],
  companion: ['What should I never plant together? ⚠️', 'Three sisters planting method? 🌽', 'Herbs that repel pests? 🌿'],
  general: ['What to plant this month? 📅', 'How to improve my soil? 🪱', 'Tips for small space gardening? 🏡'],
};

const FOLLOW_UP_QUESTIONS_FR: Record<string, string[]> = {
  planting: ['Quand semer en intérieur ? 🌱', 'Meilleur terreau pour semis ? 🪴', 'Profondeur de plantation ? 📏'],
  pests: ['Et les limaces ? 🐌', 'Recettes de pesticides naturels ? 🧪', 'Attirer les insectes utiles ? 🐝'],
  soil: ['Comment tester le pH du sol ? 🧪', 'Bon ratio de compost ? ♻️', 'Quand pailler ? 🍂'],
  watering: ['Conseils goutte-à-goutte ? 💧', 'Signes de sur-arrosage ? 🚿', 'Meilleur moment pour arroser ? ☀️'],
  companion: ['Quoi ne jamais planter ensemble ? ⚠️', 'Méthode des trois sœurs ? 🌽', 'Herbes anti-ravageurs ? 🌿'],
  general: ['Quoi planter ce mois-ci ? 📅', 'Comment améliorer mon sol ? 🪱', 'Astuces petit jardin ? 🏡'],
};

function getSuggestedQuestions(locale: string): string[] {
  const pool = locale === 'fr' ? SUGGESTED_QUESTIONS_FR : SUGGESTED_QUESTIONS_EN;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4);
}

function detectTopic(text: string): string {
  const lower = text.toLowerCase();
  if (/plant|sow|seed|sem|germin|transplant/.test(lower)) return 'planting';
  if (/pest|aphid|bug|slug|insect|pucer|limace|ravageur|maladie|disease/.test(lower)) return 'pests';
  if (/soil|compost|mulch|fertil|sol|terre|paill|engrais/.test(lower)) return 'soil';
  if (/water|irrigat|arros|drought|sécheresse|goutte/.test(lower)) return 'watering';
  if (/companion|associat|together|guild|ensemble|voisin/.test(lower)) return 'companion';
  return 'general';
}

function getFollowUpQuestions(lastAssistantMessage: string, locale: string): string[] {
  const topic = detectTopic(lastAssistantMessage);
  const pool = locale === 'fr' ? FOLLOW_UP_QUESTIONS_FR : FOLLOW_UP_QUESTIONS_EN;
  const topicQuestions = pool[topic] || pool.general;
  const generalQuestions = pool.general;
  // Pick 2 from topic + 1 from general (if different)
  const shuffledTopic = [...topicQuestions].sort(() => Math.random() - 0.5);
  const result = shuffledTopic.slice(0, 2);
  if (topic !== 'general') {
    const shuffledGeneral = [...generalQuestions].sort(() => Math.random() - 0.5);
    result.push(shuffledGeneral[0]);
  } else {
    result.push(shuffledTopic[2] || shuffledTopic[0]);
  }
  return result;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="w-7 h-7 rounded-full bg-green-800/60 flex items-center justify-center shrink-0 text-sm">
        🧑‍🌾
      </div>
      <div className="flex items-center gap-1 ml-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 bg-green-400 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-green-800/60 flex items-center justify-center shrink-0 text-sm mt-1">
          🧑‍🌾
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-green-600 text-white rounded-br-md'
            : 'bg-[#1A2F23] text-green-100 border border-green-800/30 rounded-bl-md'
        }`}
      >
        {message.content}
      </div>
    </motion.div>
  );
}

export function AiAdvisor({ userPlan = 'free' }: { userPlan?: 'free' | 'pro' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { config } = useGarden();
  const locale = useLocale();
  const t = useTranslations('advisor');

  const isPro = userPlan === 'pro';
  const suggestedQuestions = getSuggestedQuestions(locale);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (isOpen && isPro && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isPro]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const conversationHistory = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const assistantId = crypto.randomUUID();

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/ai/garden-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          gardenContext: {
            soilType: config.soilType,
            climateZone: config.climateZone,
            sunExposure: config.sunExposure,
            plantedItems: config.plantedItems,
            locale,
          },
          userPlan,
          userId: 'local-user',
          conversationHistory,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content:
              errorData.message ||
              t('errorGeneric'),
          },
        ]);
        setIsLoading(false);
        return;
      }

      const remainingHeader = response.headers.get('X-Remaining-Questions');
      if (remainingHeader !== null) {
        setRemaining(parseInt(remainingHeader, 10));
      }

      // Read the stream
      const reader = response.body?.getReader();
      if (!reader) {
        setIsLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let assistantContent = '';
      let buffer = '';

      // Add empty assistant message to fill in
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '' },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              assistantContent += parsed.content;
              const snapshot = assistantContent;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: snapshot } : m
                )
              );
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content: t('errorConnection'),
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 rounded-full bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/40 flex items-center justify-center transition-colors cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={t('openChat')}
      >
        {isOpen ? (
          <ChevronDown className="w-6 h-6" />
        ) : (
          <span className="text-2xl" aria-hidden="true">🌿</span>
        )}
        {/* PRO badge */}
        <span className="absolute -top-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-500 text-[10px] font-bold text-white rounded-full shadow">
          <Sparkles className="w-2.5 h-2.5" />
          PRO
        </span>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && !isPro && (
          <AiAdvisorLocked onClose={() => setIsOpen(false)} />
        )}

        {isOpen && isPro && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[min(70vh,600px)] max-sm:!w-[calc(100vw-2rem)] max-sm:!h-[calc(100vh-7rem)] max-sm:!bottom-20 max-sm:!right-4 bg-[#0D1F17] border border-green-800/50 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-900/80 to-emerald-900/80 px-4 py-3 border-b border-green-800/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-green-700/50 flex items-center justify-center text-lg">
                  🧑‍🌾
                </div>
                <div>
                  <h3 className="text-green-50 font-semibold text-sm">
                    {t('title')}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400/70 text-xs">{t('online')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {remaining !== null && (
                  <span className="text-green-500/50 text-xs">
                    {t('remainingToday', { remaining })}
                  </span>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-green-800/40 flex items-center justify-center text-green-400/60 hover:text-green-300 transition-colors cursor-pointer"
                  aria-label={t('closeChat')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-4xl mb-3">🌱</div>
                  <p className="text-green-100 font-medium text-sm mb-1">
                    {t('welcomeTitle')}
                  </p>
                  <p className="text-green-400/50 text-xs mb-5 max-w-[260px]">
                    {t('welcomeDescription')}
                  </p>

                  {/* Suggested questions */}
                  <div className="space-y-2 w-full max-w-[300px]">
                    {suggestedQuestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl bg-[#1A2F23] border border-green-800/30 text-green-200 text-xs hover:bg-[#243D2E] hover:border-green-700/50 transition-all cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={msg.id}>
                  <MessageBubble message={msg} />
                  {/* Quick-reply follow-up buttons after the last assistant message */}
                  {msg.role === 'assistant' &&
                    idx === messages.length - 1 &&
                    !isLoading &&
                    msg.content.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap gap-1.5 mt-2 ml-9"
                      >
                        {getFollowUpQuestions(msg.content, locale).map((q) => (
                          <button
                            key={q}
                            onClick={() => sendMessage(q)}
                            className="px-3 py-1.5 rounded-full bg-[#1A2F23] border border-green-800/30 text-green-300 text-xs hover:bg-[#243D2E] hover:border-green-700/50 transition-all cursor-pointer"
                          >
                            {q}
                          </button>
                        ))}
                      </motion.div>
                    )}
                </div>
              ))}

              {isLoading &&
                messages[messages.length - 1]?.role === 'user' && (
                  <TypingIndicator />
                )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-green-800/50 p-3 bg-[#0D1F17]">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('placeholder')}
                  rows={1}
                  className="flex-1 resize-none bg-[#1A2F23] border border-green-800/40 rounded-xl px-3.5 py-2.5 text-sm text-green-100 placeholder-green-500/40 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600/30 transition-colors max-h-24"
                  style={{
                    height: 'auto',
                    minHeight: '40px',
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 96) + 'px';
                  }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:hover:bg-green-600 flex items-center justify-center text-white transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed"
                  aria-label={t('sendMessage')}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
