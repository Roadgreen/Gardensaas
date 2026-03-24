'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useGarden } from '@/lib/hooks';
import {
  Send,
  Sparkles,
  Lock,
  Leaf,
  Bug,
  Calendar,
  FlaskConical,
  ArrowLeft,
  Bot,
  Lightbulb,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  { text: 'When should I plant tomatoes?', icon: Calendar },
  { text: 'My lettuce is yellowing, what should I do?', icon: Leaf },
  { text: 'Best companion plants for carrots?', icon: Sparkles },
  { text: 'How to deal with aphids organically?', icon: Bug },
  { text: 'How to improve my clay soil?', icon: FlaskConical },
  { text: 'What can I plant this month?', icon: Calendar },
];

const FOLLOW_UP_QUESTIONS: Record<string, { text: string; icon: typeof Leaf }[]> = {
  planting: [
    { text: 'When to start seeds indoors?', icon: Calendar },
    { text: 'Best soil mix for seedlings?', icon: FlaskConical },
    { text: 'How deep should I plant?', icon: Leaf },
  ],
  pests: [
    { text: 'What about slugs and snails?', icon: Bug },
    { text: 'Natural pesticide recipes?', icon: FlaskConical },
    { text: 'How to attract beneficial insects?', icon: Sparkles },
  ],
  soil: [
    { text: 'How to test my soil pH?', icon: FlaskConical },
    { text: 'Best compost ratio?', icon: Leaf },
    { text: 'When should I add mulch?', icon: Calendar },
  ],
  watering: [
    { text: 'Drip irrigation setup tips?', icon: Lightbulb },
    { text: 'Signs of overwatering?', icon: Leaf },
    { text: 'Best time of day to water?', icon: Calendar },
  ],
  companion: [
    { text: 'What should I never plant together?', icon: Bug },
    { text: 'Three sisters planting method?', icon: Sparkles },
    { text: 'Herbs that repel pests?', icon: Leaf },
  ],
  general: [
    { text: 'What to plant this month?', icon: Calendar },
    { text: 'How to improve my soil?', icon: FlaskConical },
    { text: 'Tips for small space gardening?', icon: Lightbulb },
  ],
};

function detectTopic(text: string): string {
  const lower = text.toLowerCase();
  if (/plant|sow|seed|germin|transplant/.test(lower)) return 'planting';
  if (/pest|aphid|bug|slug|insect|disease/.test(lower)) return 'pests';
  if (/soil|compost|mulch|fertil/.test(lower)) return 'soil';
  if (/water|irrigat|drought/.test(lower)) return 'watering';
  if (/companion|associat|together|guild/.test(lower)) return 'companion';
  return 'general';
}

function getFollowUpQuestions(lastMessage: string): { text: string; icon: typeof Leaf }[] {
  const topic = detectTopic(lastMessage);
  const topicQuestions = FOLLOW_UP_QUESTIONS[topic] || FOLLOW_UP_QUESTIONS.general;
  if (topic !== 'general') {
    const general = FOLLOW_UP_QUESTIONS.general;
    return [...topicQuestions.slice(0, 2), general[Math.floor(Math.random() * general.length)]];
  }
  return topicQuestions;
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-700 to-emerald-800 flex items-center justify-center shrink-0 text-base shadow-lg shadow-green-900/30">
        <span>&#x1F9D1;&#x200D;&#x1F33E;</span>
      </div>
      <div className="bg-[#1A2F23] border border-green-800/30 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 bg-green-400 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
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
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {!isUser && (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-700 to-emerald-800 flex items-center justify-center shrink-0 text-base shadow-lg shadow-green-900/30 mt-0.5">
          <span>&#x1F9D1;&#x200D;&#x1F33E;</span>
        </div>
      )}
      {isUser && (
        <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center shrink-0 text-sm font-bold text-white mt-0.5">
          You
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
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

function PaywallView() {
  const features = [
    { icon: Leaf, title: 'Personalized advice', description: 'Tips tailored to your soil, climate, and plants' },
    { icon: Bug, title: 'Pest & disease diagnosis', description: 'Describe symptoms, get organic solutions' },
    { icon: Calendar, title: 'Seasonal guidance', description: 'Know exactly when to plant, prune, and harvest' },
    { icon: FlaskConical, title: 'Soil & composting tips', description: 'Improve your soil for healthier plants' },
  ];

  return (
    <div className="min-h-screen bg-[#0D1F17] py-8 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/garden/dashboard" className="inline-flex items-center gap-2 text-green-400/60 hover:text-green-300 text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          {/* Hero preview */}
          <div className="relative rounded-2xl border border-green-800/30 bg-gradient-to-br from-green-900/30 to-emerald-900/10 p-8 mb-8 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(34,197,94,0.06)_0%,_transparent_70%)]" />
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-full bg-green-900/50 border-2 border-green-700/50 flex items-center justify-center mx-auto mb-5">
                <Lock className="w-9 h-9 text-green-400" />
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                PRO Feature
              </span>

              <h1 className="text-3xl font-bold text-green-50 mb-3">
                AI Garden Advisor
              </h1>
              <p className="text-green-200/60 text-lg max-w-md mx-auto mb-6">
                Your personal gardening expert who knows your garden inside and out.
                Available 24/7, 10 questions per day.
              </p>

              {/* Preview chat bubbles */}
              <div className="max-w-sm mx-auto space-y-3 mb-8 text-left">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center shrink-0 text-xs font-bold text-white">
                    You
                  </div>
                  <div className="bg-green-600/20 border border-green-600/30 rounded-2xl rounded-bl-md px-3 py-2 text-sm text-green-200">
                    My basil leaves are turning yellow. Help!
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-700 to-emerald-800 flex items-center justify-center shrink-0 text-xs">
                    <span>&#x1F9D1;&#x200D;&#x1F33E;</span>
                  </div>
                  <div className="bg-[#1A2F23]/50 border border-green-800/20 rounded-2xl rounded-bl-md px-3 py-2 text-sm text-green-300/70 blur-[2px]">
                    Yellowing basil leaves usually indicate overwatering or nutrient deficiency. Given your loamy soil...
                  </div>
                </div>
              </div>

              <Link href="/pricing">
                <Button size="lg" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Upgrade to PRO - 9.99&euro;/month
                </Button>
              </Link>
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-[#142A1E] border border-green-900/40 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-green-800/40 flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-green-100 text-sm font-medium">{feature.title}</p>
                  <p className="text-green-400/50 text-xs">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function AdvisorPageClient() {
  const { data: session } = useSession();
  const userPlan = (session?.user as Record<string, unknown>)?.plan as string | undefined;
  const isPro = userPlan === 'pro';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { config } = useGarden();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (isPro && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isPro]);

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
          },
          userPlan: 'pro',
          userId: session?.user?.id || 'local-user',
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
            content: errorData.message || 'Sorry, something went wrong. Please try again.',
          },
        ]);
        setIsLoading(false);
        return;
      }

      const remainingHeader = response.headers.get('X-Remaining-Questions');
      if (remainingHeader !== null) {
        setRemaining(parseInt(remainingHeader, 10));
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setIsLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let assistantContent = '';
      let buffer = '';

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
            content: 'Connection error. Please try again.',
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

  // Show paywall for non-pro users
  if (!isPro) {
    return <PaywallView />;
  }

  return (
    <div className="min-h-screen bg-[#0D1F17] flex flex-col">
      {/* Header */}
      <div className="border-b border-green-800/30 bg-gradient-to-r from-green-900/40 to-emerald-900/20 px-6 py-4 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/garden/dashboard" className="text-green-400/60 hover:text-green-300 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-700 to-emerald-800 flex items-center justify-center text-lg shadow-lg shadow-green-900/30">
              <span>&#x1F9D1;&#x200D;&#x1F33E;</span>
            </div>
            <div>
              <h1 className="text-green-50 font-semibold flex items-center gap-2">
                Garden Advisor
                <Bot className="w-4 h-4 text-green-500/60" />
              </h1>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400/70 text-xs">Online</span>
              </div>
            </div>
          </div>
          {remaining !== null && (
            <span className="text-green-500/50 text-sm">
              {remaining} questions left today
            </span>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-green-900/50 flex items-center justify-center text-3xl mb-4">
                <span>&#x1F331;</span>
              </div>
              <h2 className="text-xl font-semibold text-green-100 mb-2">
                Your personal garden advisor
              </h2>
              <p className="text-green-400/50 text-sm mb-8 max-w-md">
                Ask me anything about gardening! I know your soil type ({config.soilType}),
                climate ({config.climateZone}), and what you have planted.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 w-full max-w-lg">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q.text}
                    onClick={() => sendMessage(q.text)}
                    className="flex items-center gap-3 text-left px-4 py-3 rounded-xl bg-[#1A2F23] border border-green-800/30 text-green-200 text-sm hover:bg-[#243D2E] hover:border-green-700/50 transition-all cursor-pointer"
                  >
                    <q.icon className="w-4 h-4 text-green-500/60 shrink-0" />
                    <span>{q.text}</span>
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
                    className="flex flex-wrap gap-2 mt-3 ml-12"
                  >
                    {getFollowUpQuestions(msg.content).map((q) => (
                      <button
                        key={q.text}
                        onClick={() => sendMessage(q.text)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1A2F23] border border-green-800/30 text-green-200 text-sm hover:bg-[#243D2E] hover:border-green-700/50 transition-all cursor-pointer"
                      >
                        <q.icon className="w-3.5 h-3.5 text-green-500/60 shrink-0" />
                        <span>{q.text}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <TypingIndicator />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-green-800/30 bg-[#0D1F17]/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a gardening question..."
              rows={1}
              className="flex-1 resize-none bg-[#1A2F23] border border-green-800/40 rounded-xl px-4 py-3 text-sm text-green-100 placeholder-green-500/40 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600/30 transition-colors max-h-32"
              style={{ height: 'auto', minHeight: '48px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="w-12 h-12 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:hover:bg-green-600 flex items-center justify-center text-white transition-colors shrink-0 cursor-pointer disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
