import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Compass,
  Loader2,
  MessageSquare,
  RotateCcw,
  Send,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { CampusActivity, CampusMember } from '../data/campusData';
import {
  AssistantModelMode,
  ChatTurnMessage,
  NavigationAction,
} from '../utils/campusAssistant';
import { apiClient } from '../utils/apiClient';

interface CampusConciergeChatProps {
  isOpen: boolean;
  onClose: () => void;
  member: CampusMember;
  activities: CampusActivity[];
  canBroadcast: boolean;
  onExecuteNavigation: (action: NavigationAction) => void;
}

const STARTER_PROMPTS = [
  'Where is the 100m Sprint Heats and how does the rain delay affect it?',
  'How do I navigate the website to view the schedule and reserve a session?',
  'Which gates and venues are hosting Football, Basketball, and Cultural Fest?',
  'What tasks or medical waivers need to be completed before 12:00 PM?',
];

export const CampusConciergeChat: React.FC<CampusConciergeChatProps> = ({
  isOpen,
  onClose,
  member,
  canBroadcast,
  onExecuteNavigation,
}) => {
  const createInitialWelcomeMessage = (): ChatTurnMessage => ({
    id: 'msg-welcome',
    role: 'model',
    text: `Welcome to Alderbrook Commons, ${member.fullName.split(' ')[0]}! I am your Campus Event & Navigation Concierge. Ask me anything about today's sports heats, cultural performances, rain-delay adjustments, gate locations, or how to find features across this dashboard.`,
    timestamp: 'Just now',
    modelUsed: 'gemini-3.8-flash',
    navigationActions: [
      {
        id: 'init-schedule',
        type: 'open_schedule',
        label: 'Open Schedule & Registration',
        description: 'Browse all 4 sessions and reserve or cancel spots',
      },
      {
        id: 'init-map',
        type: 'open_map',
        label: 'Open Venue Map',
        description: 'View Track A, Main Field, Basketball Arena & Cultural Hall gates',
      },
      {
        id: 'init-todo',
        type: 'open_todo',
        label: 'Open To-Do Checklist',
        description: 'Review event day tasks and the 12:00 PM waiver deadline',
      },
    ],
  });

  const [messages, setMessages] = useState<ChatTurnMessage[]>(() => [
    createInitialWelcomeMessage(),
  ]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<AssistantModelMode>('general');
  const [lastNavFeedback, setLastNavFeedback] = useState<string | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) {
    return null;
  }

  const submitPrompt = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || isLoading) return;

    const userTurn: ChatTurnMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: 'Just now',
    };

    const historyForApi = messages.map((m) => ({
      role: m.role,
      text: m.text,
    }));

    setMessages((prev) => [...prev, userTurn]);
    setInput('');
    setIsLoading(true);
    setLastNavFeedback(null);

    try {
      const response = await apiClient.sendChatMessage({
        message: trimmed,
        history: historyForApi,
        campusId: member.campusId,
        mode,
      });

      if (response.error) {
        const errorTurn: ChatTurnMessage = {
          id: `model-err-${Date.now()}`,
          role: 'model',
          text: `Unable to complete request: ${response.error}`,
          timestamp: 'Just now',
          navigationActions: response.navigationActions,
        };
        setMessages((prev) => [...prev, errorTurn]);
      } else {
        const modelTurn: ChatTurnMessage = {
          id: `model-${Date.now()}`,
          role: 'model',
          text:
            response.reply ||
            'Here are the most relevant sections on the dashboard for your request.',
          timestamp: 'Just now',
          modelUsed: response.modelUsed,
          navigationActions: response.navigationActions,
        };
        setMessages((prev) => [...prev, modelTurn]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `model-neterr-${Date.now()}`,
          role: 'model',
          text: 'Network error while contacting the Campus Concierge service. You can still use the quick navigation shortcuts below.',
          timestamp: 'Just now',
          navigationActions: [
            {
              id: 'fallback-schedule',
              type: 'open_schedule',
              label: 'Open Schedule Tab',
              description: 'Browse sessions and reserve your spot',
            },
            {
              id: 'fallback-map',
              type: 'open_map',
              label: 'Open Venue Map',
              description: 'View campus gates and venue locations',
            },
          ],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitPrompt(input);
  };

  const handleResetChat = () => {
    setMessages([createInitialWelcomeMessage()]);
    setLastNavFeedback(null);
  };

  const handleTriggerNav = (action: NavigationAction) => {
    onExecuteNavigation(action);
    setLastNavFeedback(`Navigated to: ${action.label}`);
  };

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-label="Campus Event and Navigation Assistant"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[430px] max-h-[82vh] bg-[#14171E] border border-[#2E3646] rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.75)] flex flex-col overflow-hidden text-[#E5E7EB]"
    >
      {/* Top Header */}
      <div className="px-4 py-3.5 bg-[#191D26] border-b border-[#262B36] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#172536] border border-[#38BDF8]/60 flex items-center justify-center text-[#4DA8FF] shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white truncate">
              Campus Guide & Event Assistant
            </h2>
            <p className="text-[11px] text-[#9CA3AF] truncate">
              Navigation · Live Schedules · Venue Help
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleResetChat}
            title="Reset conversation"
            aria-label="Reset conversation"
            className="min-h-[36px] min-w-[36px] rounded-lg hover:bg-[#252A36] flex items-center justify-center text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close Campus Guide"
            aria-label="Close Campus Guide"
            className="min-h-[36px] min-w-[36px] rounded-lg hover:bg-[#252A36] flex items-center justify-center text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Switcher & Quick Website Navigation Bar */}
      <div className="px-4 py-2.5 bg-[#161920] border-b border-[#232732] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="inline-flex items-center bg-[#20242E] p-0.5 rounded-lg border border-[#2C3240]">
          <button
            type="button"
            onClick={() => setMode('general')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              mode === 'general'
                ? 'bg-[#172536] text-[#4DA8FF] border border-[#38BDF8]/50'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Event Guide</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('fast')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
              mode === 'fast'
                ? 'bg-[#172536] text-[#4DA8FF] border border-[#38BDF8]/50'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Fast Nav</span>
          </button>
        </div>

        <span className="text-[11px] text-[#8E95A2] font-mono-tabular">
          {canBroadcast ? 'Organizer Mode' : 'Student Mode'}
        </span>
      </div>

      {/* Navigation Feedback Banner */}
      {lastNavFeedback && (
        <div
          role="status"
          className="px-4 py-1.5 bg-[#172536] border-b border-[#38BDF8]/30 text-[11px] text-[#7DD3FC] flex items-center justify-between"
        >
          <span>{lastNavFeedback}</span>
          <button
            type="button"
            onClick={() => setLastNavFeedback(null)}
            className="text-[#9CA3AF] hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Scrollable Multi-Turn Conversation Thread */}
      <div
        data-testid="concierge-message-thread"
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[260px] max-h-[420px]"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed whitespace-pre-line ${
                  isUser
                    ? 'bg-[#2997FF] text-[#051224] font-medium'
                    : 'bg-[#1E222B] border border-[#2C323F] text-[#E5E7EB]'
                }`}
              >
                {msg.text.replace(/\*\*/g, '')}
              </div>

              {/* Interactive Website Navigation Actions attached to Assistant Replies */}
              {!isUser &&
                msg.navigationActions &&
                msg.navigationActions.length > 0 && (
                  <div className="mt-2 w-full max-w-[92%] space-y-1.5">
                    <p className="text-[11px] text-[#8E95A2] px-0.5">
                      Jump to section on website:
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {msg.navigationActions.map((act) => (
                        <button
                          key={`${msg.id}-${act.id}`}
                          type="button"
                          aria-label={act.label}
                          onClick={() => handleTriggerNav(act)}
                          className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-[#1A2230] hover:bg-[#212D40] border border-[#324663] text-left flex items-center justify-between gap-2 transition-colors cursor-pointer group"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#58B9FF] truncate">
                              {act.label}
                            </p>
                            <p className="text-[11px] text-[#9CA3AF] truncate">
                              {act.description}
                            </p>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-[#58B9FF] shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-[#9CA3AF] bg-[#1E222B] border border-[#2C323F] rounded-2xl px-3.5 py-2.5 w-fit">
            <Loader2 className="w-4 h-4 animate-spin text-[#4DA8FF]" />
            <span>Checking campus schedule & venues...</span>
          </div>
        )}

        {/* Starter Prompts shown when only the initial welcome message is present */}
        {messages.length === 1 && !isLoading && (
          <div className="pt-1 space-y-1.5">
            <p className="text-[11px] text-[#8E95A2]">
              Suggested questions about events & navigation:
            </p>
            <div className="space-y-1.5">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void submitPrompt(prompt)}
                  className="w-full text-left px-3 py-2 rounded-xl bg-[#1A1D25] hover:bg-[#232733] border border-[#2A2F3C] text-xs text-[#D1D5DB] hover:text-white transition-colors cursor-pointer flex items-center justify-between gap-2"
                >
                  <span>{prompt}</span>
                  <MessageSquare className="w-3.5 h-3.5 text-[#4DA8FF] shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={threadEndRef} />
      </div>

      {/* Message Input Form */}
      <form
        onSubmit={handleFormSubmit}
        className="p-3 bg-[#191D26] border-t border-[#262B36] flex items-center gap-2"
      >
        <label htmlFor="concierge-chat-input" className="sr-only">
          Ask about campus events, venues, or website navigation
        </label>
        <input
          id="concierge-chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about events, gates, or where to click..."
          disabled={isLoading}
          className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl bg-[#12151C] border border-[#2E3442] text-xs sm:text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#38BDF8]"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          aria-label="Send message to Campus Guide"
          className="min-h-[42px] min-w-[42px] px-3 rounded-xl bg-[#2997FF] hover:bg-[#47A8FF] disabled:opacity-40 text-[#051224] font-semibold flex items-center justify-center transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  );
};
