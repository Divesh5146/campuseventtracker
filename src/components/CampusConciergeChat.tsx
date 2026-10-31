import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Compass,
  Loader2,
  MessageSquare,
  Mic,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { CampusActivity, CampusMember } from '../data/campusData';
import {
  AssistantModelMode,
  AssistantVoiceName,
  ChatTurnMessage,
  NavigationAction,
  prepareTextForSpeech,
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
  'How can I switch between Annual Sports Day and Autumn Cultural Fest?',
];

const VOICE_OPTIONS: { id: AssistantVoiceName; label: string }[] = [
  { id: 'Kore', label: 'Kore' },
  { id: 'Puck', label: 'Puck' },
  { id: 'Zephyr', label: 'Zephyr' },
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
    text: `Welcome to Alderbrook Commons, ${member.fullName.split(' ')[0]}! I am your Campus Voice & Navigation Concierge. You can type or tap the microphone to ask about today's sports heats, cultural performances, rain-delay adjustments, gate locations, or ask me to open any section of this website.`,
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
        id: 'init-manager',
        type: 'open_manager',
        label: 'Open Event Manager',
        description: 'Switch between Annual Sports Day & Autumn Cultural Fest',
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

  // Voice Assistant state
  const [autoSpeakReplies, setAutoSpeakReplies] = useState<boolean>(true);
  const [selectedVoice, setSelectedVoice] = useState<AssistantVoiceName>('Kore');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [synthesizingMessageId, setSynthesizingMessageId] = useState<string | null>(null);
  const [voiceStatusNote, setVoiceStatusNote] = useState<string | null>(null);

  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen && messages.length > 1) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
      }
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) {
    return null;
  }

  const stopAudioPlayback = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlayingMessageId(null);
  };

  const fallbackBrowserSpeak = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setPlayingMessageId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(prepareTextForSpeech(text));
    utterance.rate = 1.02;
    utterance.onend = () => setPlayingMessageId(null);
    utterance.onerror = () => setPlayingMessageId(null);
    setPlayingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handlePlayMessageAudio = async (msg: ChatTurnMessage) => {
    if (playingMessageId === msg.id) {
      stopAudioPlayback();
      return;
    }

    stopAudioPlayback();
    setVoiceStatusNote(null);

    // If audio is already cached on this message, play immediately
    if (msg.audioBase64) {
      try {
        const audio = new Audio(`data:audio/wav;base64,${msg.audioBase64}`);
        activeAudioRef.current = audio;
        setPlayingMessageId(msg.id);
        audio.onended = () => {
          setPlayingMessageId(null);
          activeAudioRef.current = null;
        };
        audio.onerror = () => {
          activeAudioRef.current = null;
          fallbackBrowserSpeak(msg.id, msg.text);
        };
        await audio.play();
        return;
      } catch {
        fallbackBrowserSpeak(msg.id, msg.text);
        return;
      }
    }

    setSynthesizingMessageId(msg.id);
    try {
      const ttsRes = await apiClient.synthesizeSpeech({
        text: msg.text,
        voiceName: selectedVoice,
      });

      if (ttsRes.audioBase64) {
        const base64Audio = ttsRes.audioBase64;
        setMessages((prev) =>
          prev.map((item) =>
            item.id === msg.id ? { ...item, audioBase64: base64Audio } : item
          )
        );

        const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
        activeAudioRef.current = audio;
        setPlayingMessageId(msg.id);
        audio.onended = () => {
          setPlayingMessageId(null);
          activeAudioRef.current = null;
        };
        audio.onerror = () => {
          activeAudioRef.current = null;
          fallbackBrowserSpeak(msg.id, msg.text);
        };
        await audio.play();
      } else {
        fallbackBrowserSpeak(msg.id, msg.text);
      }
    } catch {
      fallbackBrowserSpeak(msg.id, msg.text);
    } finally {
      setSynthesizingMessageId(null);
    }
  };

  const submitPrompt = async (
    promptText: string,
    options?: { fromVoice?: boolean }
  ) => {
    const trimmed = promptText.trim();
    if (!trimmed || isLoading) return;

    stopAudioPlayback();

    const userTurn: ChatTurnMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: 'Just now',
      isVoiceQuery: options?.fromVoice,
    };

    const historyForApi = messages.map((m) => ({
      role: m.role,
      text: m.text,
    }));

    setMessages((prev) => [...prev, userTurn]);
    setInput('');
    setIsLoading(true);
    setLastNavFeedback(null);
    setVoiceStatusNote(null);

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

        // If the user asked via voice to open/show a specific section, execute top navigation action automatically
        if (
          options?.fromVoice &&
          response.navigationActions &&
          response.navigationActions.length > 0 &&
          /\b(open|show|go to|take me|switch|focus)\b/i.test(trimmed)
        ) {
          const topAction = response.navigationActions[0];
          onExecuteNavigation(topAction);
          setLastNavFeedback(`Voice navigated to: ${topAction.label}`);
        }

        // Automatically speak reply if Voice Reply is enabled or query came from microphone
        if (autoSpeakReplies || options?.fromVoice) {
          void handlePlayMessageAudio(modelTurn);
        }
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

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('Failed to read audio blob'));
      reader.readAsDataURL(blob);
    });

  const handleToggleRecording = async () => {
    if (isRecording) {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== 'inactive'
      ) {
        mediaRecorderRef.current.stop();
      }
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setIsRecording(false);
      return;
    }

    stopAudioPlayback();
    setVoiceStatusNote(null);

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setVoiceStatusNote(
        'Microphone recording is not available in this browser environment.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferredMime =
        typeof MediaRecorder !== 'undefined' &&
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      setRecordingSeconds(0);
      setIsRecording(true);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (recordingTimerRef.current) {
          window.clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setIsRecording(false);

        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || preferredMime,
        });
        if (audioBlob.size === 0) {
          setVoiceStatusNote('No audio captured. Please try speaking again.');
          return;
        }

        setIsTranscribing(true);
        setVoiceStatusNote('Transcribing your voice with Gemini...');
        try {
          const base64Audio = await blobToBase64(audioBlob);
          const cleanMime = (recorder.mimeType || 'audio/webm').split(';')[0];
          const transcriptRes = await apiClient.transcribeVoiceAudio({
            audioBase64: base64Audio,
            mimeType: cleanMime,
          });

          if (transcriptRes.error) {
            setVoiceStatusNote(transcriptRes.error);
            return;
          }

          const spokenText = (transcriptRes.text || '').trim();
          if (!spokenText) {
            setVoiceStatusNote(
              'Could not hear a clear question. Please try speaking again.'
            );
            return;
          }

          setVoiceStatusNote(null);
          await submitPrompt(spokenText, { fromVoice: true });
        } catch {
          setVoiceStatusNote('Unable to transcribe voice recording.');
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
    } catch {
      setIsRecording(false);
      setVoiceStatusNote(
        'Microphone permission denied or unavailable. Please allow microphone access to use voice input.'
      );
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitPrompt(input);
  };

  const handleResetChat = () => {
    stopAudioPlayback();
    setMessages([createInitialWelcomeMessage()]);
    setLastNavFeedback(null);
    setVoiceStatusNote(null);
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
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[440px] max-h-[84vh] bg-[#14171E] border border-[#2E3646] rounded-2xl shadow-[0_24px_60px_rgba(0,0,0,0.75)] flex flex-col overflow-hidden text-[#E5E7EB]"
    >
      {/* Top Header */}
      <div className="px-4 py-3.5 bg-[#191D26] border-b border-[#262B36] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#172536] border border-[#38BDF8]/60 flex items-center justify-center text-[#4DA8FF] shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white truncate">
              Campus Voice & Event Assistant
            </h2>
            <p className="text-[11px] text-[#9CA3AF] truncate">
              Voice AI · Navigation · Live Schedules
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
            onClick={() => {
              stopAudioPlayback();
              onClose();
            }}
            title="Close Campus Guide"
            aria-label="Close Campus Guide"
            className="min-h-[36px] min-w-[36px] rounded-lg hover:bg-[#252A36] flex items-center justify-center text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Switcher & Voice Assistant Controls Bar */}
      <div className="px-4 py-2.5 bg-[#161920] border-b border-[#232732] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="inline-flex items-center bg-[#20242E] p-0.5 rounded-lg border border-[#2C3240]">
          <button
            type="button"
            onClick={() => setMode('general')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
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
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'fast'
                ? 'bg-[#172536] text-[#4DA8FF] border border-[#38BDF8]/50'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Fast Nav</span>
          </button>
        </div>

        {/* Voice Reply Toggle & Voice Persona Picker */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (autoSpeakReplies) {
                stopAudioPlayback();
              }
              setAutoSpeakReplies((prev) => !prev);
            }}
            aria-label={
              autoSpeakReplies ? 'Mute voice replies' : 'Enable voice replies'
            }
            className={`min-h-[28px] px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              autoSpeakReplies
                ? 'bg-[#172536] border-[#38BDF8]/50 text-[#4DA8FF]'
                : 'bg-[#20242E] border-[#2C3240] text-[#9CA3AF] hover:text-white'
            }`}
          >
            {autoSpeakReplies ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span>{autoSpeakReplies ? 'Voice On' : 'Voice Muted'}</span>
          </button>

          <label htmlFor="concierge-voice-select" className="sr-only">
            Select AI Voice Persona
          </label>
          <select
            id="concierge-voice-select"
            aria-label="Select AI Voice Persona"
            value={selectedVoice}
            onChange={(e) =>
              setSelectedVoice(e.target.value as AssistantVoiceName)
            }
            className="min-h-[28px] px-2 py-1 rounded-lg bg-[#20242E] border border-[#2C3240] text-[11px] font-medium text-[#D1D5DB] focus:outline-none focus:border-[#38BDF8] cursor-pointer"
          >
            {VOICE_OPTIONS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label} Voice
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation or Voice Status Banner */}
      {(lastNavFeedback || voiceStatusNote) && (
        <div
          role="status"
          className="px-4 py-1.5 bg-[#172536] border-b border-[#38BDF8]/30 text-[11px] text-[#7DD3FC] flex items-center justify-between gap-2"
        >
          <span className="truncate">{voiceStatusNote || lastNavFeedback}</span>
          <button
            type="button"
            onClick={() => {
              setLastNavFeedback(null);
              setVoiceStatusNote(null);
            }}
            className="text-[#9CA3AF] hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Scrollable Multi-Turn Conversation Thread */}
      <div
        data-testid="concierge-message-thread"
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[260px] max-h-[410px]"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isPlaying = playingMessageId === msg.id;
          const isSynthesizing = synthesizingMessageId === msg.id;

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

                {/* Listen / Stop Voice Button on Assistant Replies */}
                {!isUser && (
                  <div className="mt-2 pt-2 border-t border-[#2C323F] flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#8E95A2] font-mono-tabular">
                      {selectedVoice} · Voice Concierge
                    </span>
                    <button
                      type="button"
                      onClick={() => void handlePlayMessageAudio(msg)}
                      disabled={isSynthesizing}
                      aria-label={
                        isPlaying
                          ? 'Stop speaking response'
                          : 'Listen to response'
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isPlaying
                          ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300'
                          : 'bg-[#172536] hover:bg-[#1E3148] border border-[#38BDF8]/40 text-[#4DA8FF]'
                      }`}
                    >
                      {isSynthesizing ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Synthesizing...</span>
                        </>
                      ) : isPlaying ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          <span>Stop Audio</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
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

        {(isLoading || isTranscribing) && (
          <div className="flex items-center gap-2 text-xs text-[#9CA3AF] bg-[#1E222B] border border-[#2C323F] rounded-2xl px-3.5 py-2.5 w-fit">
            <Loader2 className="w-4 h-4 animate-spin text-[#4DA8FF]" />
            <span>
              {isTranscribing
                ? 'Transcribing spoken question...'
                : 'Checking campus schedule & venues...'}
            </span>
          </div>
        )}

        {/* Starter Prompts shown when only the initial welcome message is present */}
        {messages.length === 1 && !isLoading && !isTranscribing && (
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

      {/* Voice Recording Bar or Text Message Input Form */}
      <form
        onSubmit={handleFormSubmit}
        className="p-3 bg-[#191D26] border-t border-[#262B36] flex items-center gap-2"
      >
        <button
          type="button"
          onClick={() => void handleToggleRecording()}
          disabled={isLoading || isTranscribing}
          title={
            isRecording
              ? 'Stop recording and send voice question'
              : 'Speak to Campus Voice Assistant'
          }
          aria-label={
            isRecording
              ? 'Stop recording voice question'
              : 'Speak to Campus Voice Assistant'
          }
          className={`min-h-[42px] px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
            isRecording
              ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_16px_rgba(244,63,94,0.3)]'
              : 'bg-[#172536] hover:bg-[#1E3148] border-[#38BDF8]/50 text-[#4DA8FF]'
          }`}
        >
          {isRecording ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span className="font-mono-tabular">
                0:{String(recordingSeconds).padStart(2, '0')}
              </span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>Voice</span>
            </>
          )}
        </button>

        <label htmlFor="concierge-chat-input" className="sr-only">
          Ask about campus events, venues, or website navigation
        </label>
        <input
          id="concierge-chat-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isRecording
              ? 'Listening... tap stop to send'
              : 'Ask or tap Voice to speak...'
          }
          disabled={isLoading || isRecording || isTranscribing}
          className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl bg-[#12151C] border border-[#2E3442] text-xs sm:text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#38BDF8]"
        />
        <button
          type="submit"
          disabled={isLoading || isRecording || isTranscribing || !input.trim()}
          aria-label="Send message to Campus Guide"
          className="min-h-[42px] min-w-[42px] px-3 rounded-xl bg-[#2997FF] hover:bg-[#47A8FF] disabled:opacity-40 text-[#051224] font-semibold flex items-center justify-center transition-colors shrink-0 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  );
};
