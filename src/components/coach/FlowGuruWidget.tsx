'use client';

import { useMemo, useState, useEffect } from 'react';
import { Mountain, X, SendHorizonal } from 'lucide-react';

type Role = 'user' | 'assistant';

interface Message {
  id: string;
  role: Role;
  text: string;
}

const STARTER: Message = {
  id: 'start',
  role: 'assistant',
  text: "I’m FlowGuru. Speak plainly — I’ll help you choose wisely.",
};

const quickStarts = [
  'Sleep vs gym',
  'Late-night screens',
  'Low energy',
  'Too much stress',
];

function buildResponse(input: string) {
  const text = input.toLowerCase();

  const hasSleep = /sleep|tired|insomnia|late/.test(text);
  const hasGym = /gym|workout|train|exercise|run/.test(text);
  const hasScreen = /screen|phone|scroll|doom|social/.test(text);
  const hasStress = /stress|anxious|overwhelmed/.test(text);
  const hasFood = /diet|food|junk|sugar|snack/.test(text);

  if (hasSleep && hasGym) {
    return {
      reply:
        'This is a true trade. If training lifts your long game but cuts your sleep, choose the smaller session earlier and protect the bedtime.',
      question: 'What time could you realistically train on weekdays?',
    };
  }

  if (hasSleep && hasScreen) {
    return {
      reply:
        'Screens aren’t evil; timing is. Create a 30–45 minute landing zone before bed and your sleep steadies without a full purge.',
      question: 'Which app steals your nights most?',
    };
  }

  if (hasStress) {
    return {
      reply:
        'When stress rises, the smallest ritual wins. Choose a calming action so easy you can’t refuse, then anchor it to the same cue daily.',
      question: 'Which part of your day feels most chaotic?',
    };
  }

  if (hasFood) {
    return {
      reply:
        'Food changes stick when you upgrade, not restrict. Add one stable meal you can repeat before changing anything else.',
      question: 'Which meal is the messiest for you right now?',
    };
  }

  if (hasGym) {
    return {
      reply:
        'Consistency comes from lowering the bar. A short, repeatable session beats the perfect plan you skip.',
        question: 'What’s the minimum session you’d do even on a busy day?',
    };
  }

  return {
    reply:
      'Choose one lever that matters most. We’ll make it small, then test for a week.',
    question: 'What feels like the biggest bottleneck?',
  };
}

export function FlowGuruWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([STARTER]);
  const [input, setInput] = useState('');
  const [pinned, setPinned] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<Message[]>([]);

  const lastAssistant = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'assistant') return messages[i];
    }
    return STARTER;
  }, [messages]);

  useEffect(() => {
    const raw = localStorage.getItem('lifeflow.flowguru.v1');
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { messages?: Message[]; pinned?: boolean; open?: boolean };
        if (parsed.messages?.length) setMessages(parsed.messages);
        if (typeof parsed.pinned === 'boolean') setPinned(parsed.pinned);
        if (typeof parsed.open === 'boolean') setOpen(parsed.open);
      } catch {
        // ignore corrupted state
      }
    }
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    localStorage.setItem(
      'lifeflow.flowguru.v1',
      JSON.stringify({ messages, pinned, open })
    );
  }, [messages, pinned, open, hasLoaded]);

  const clearMemory = () => {
    localStorage.removeItem('lifeflow.flowguru.v1');
    setMessages([STARTER]);
    setInput('');
    setPendingMessages([]);
  };

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const { reply, question } = buildResponse(trimmed);
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', text: trimmed },
    ]);
    setPendingMessages([
      { id: `a-${Date.now()}-r`, role: 'assistant', text: reply },
      { id: `a-${Date.now()}-q`, role: 'assistant', text: question },
    ]);
    setIsTyping(true);
    setInput('');
  };

  const handleQuickStart = (text: string) => {
    setInput(text);
  };

  useEffect(() => {
    if (!isTyping || pendingMessages.length === 0) return;

    const next = pendingMessages[0];
    const delay = 500;
    const timer = window.setTimeout(() => {
      setMessages((prev) => [...prev, next]);
      setPendingMessages((prev) => prev.slice(1));
    }, delay);

    return () => window.clearTimeout(timer);
  }, [isTyping, pendingMessages]);

  useEffect(() => {
    if (isTyping && pendingMessages.length === 0) setIsTyping(false);
  }, [isTyping, pendingMessages.length]);

  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-[60]">
      {(open || pinned) && (
        <div className="w-[320px] sm:w-[360px] rounded-2xl overflow-hidden border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0f1115] shadow-2xl">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-white/[0.08]">
            <div className="relative w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <Mountain size={16} className="text-emerald-500" />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-[#0f1115]" />
            </div>
            <div className="flex-1">
              <p className="text-[12px] text-gray-400 dark:text-white/40 uppercase tracking-wider">FlowGuru</p>
              <p className="text-[13px] font-semibold">Guided choices, not lectures</p>
            </div>
            <button
              onClick={clearMemory}
              className="px-2 py-1 rounded-lg text-[11px] font-semibold border border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-white/60 hover:text-gray-800 dark:hover:text-white transition-colors"
              title="Clear memory"
            >
              Clear
            </button>
            <button
              onClick={() => setPinned((v) => !v)}
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                pinned
                  ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                  : 'bg-gray-100 dark:bg-white/[0.04] text-gray-500 dark:text-white/60 border-gray-200 dark:border-white/[0.08]'
              }`}
              title={pinned ? 'Unpin' : 'Pin'}
            >
              {pinned ? 'Pinned' : 'Pin'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white/70 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>

          <div className="px-4 py-3 space-y-3 max-h-[340px] overflow-y-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'ml-6 text-gray-700 dark:text-white/80'
                    : 'mr-6 text-gray-600 dark:text-white/70'
                }`}
              >
                <div
                  className={`inline-block px-3 py-2 rounded-xl ${
                    msg.role === 'user'
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06]'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="mr-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-bounce [animation-delay:120ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 animate-bounce [animation-delay:240ms]" />
                </div>
              </div>
            )}

            {messages.length <= 2 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {quickStarts.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQuickStart(q)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.06] hover:text-emerald-500 hover:border-emerald-400/40 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-gray-200 dark:border-white/[0.08]">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Tell me what you’re weighing..."
                className="flex-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-[13px] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 outline-none focus:border-emerald-400/60"
              />
              <button
                onClick={send}
                className="w-9 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-colors"
                title="Send"
              >
                <SendHorizonal size={16} />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-white/35 mt-2">
              Last prompt: {lastAssistant.text}
            </p>
          </div>
        </div>
      )}

      {!open && !pinned && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-colors"
        >
          <div className="relative w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
            <Mountain size={14} className="text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white/90" />
          </div>
          <span className="text-[12px] font-semibold">Talk to FlowGuru</span>
        </button>
      )}
    </div>
  );
}
