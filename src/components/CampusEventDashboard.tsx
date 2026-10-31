import React, { useState } from 'react';
import {
  AlarmClock,
  AlertTriangle,
  Calendar,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Map as MapIcon,
  MapPin,
  Megaphone,
  Plus,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import {
  ActivityCategory,
  AnnouncementPriority,
  CAMPUS_VENUES,
  CampusActivity,
  CampusAnnouncement,
  CampusMember,
  INITIAL_GANTT_ROWS,
  PROGRESS_STEPS,
} from '../data/campusData';
import {
  BroadcastInput,
  createAnnouncementBroadcast,
} from '../utils/campusAuth';
import { NavigationAction } from '../utils/campusAssistant';
import { CampusConciergeChat } from './CampusConciergeChat';

interface CampusEventDashboardProps {
  member: CampusMember;
  canBroadcast: boolean;
  announcements: CampusAnnouncement[];
  activities: CampusActivity[];
  registeredIds: string[];
  onUpdateAnnouncements: (next: CampusAnnouncement[]) => void;
  onBroadcastAnnouncement?: (
    input: BroadcastInput
  ) => Promise<{ valid: boolean; error?: string }>;
  onToggleReservation: (activityId: string) => void;
  onLogout: () => void;
}

export const CampusEventDashboard: React.FC<CampusEventDashboardProps> = ({
  member,
  canBroadcast,
  announcements,
  activities,
  registeredIds,
  onUpdateAnnouncements,
  onBroadcastAnnouncement,
  onToggleReservation,
  onLogout,
}) => {
  // Top-left card tab: 'events' (default matching template) | 'schedule'
  const [leftTab, setLeftTab] = useState<'events' | 'schedule'>('events');

  // Top-right toolbar active overlay drawer: null | 'manager' | 'map'
  const [activeDrawer, setActiveDrawer] = useState<'manager' | 'map' | null>(null);

  // Selected featured event for header & progress tracker
  const [selectedEventTitle, setSelectedEventTitle] = useState<string>('Annual Sports Day 2026');
  const [selectedEventDate, setSelectedEventDate] = useState<string>(
    'Oct 15, 2026 • Coordinator: Prof. R. Sharma'
  );

  // Active activity in Progress & Real-Time card
  const [selectedActivityId, setSelectedActivityId] = useState<string>('evt-sprint-heats');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(2); // Index 2 = "Heats Live"

  // Organizer "+ New Broadcast" modal state
  const [isBroadcastOpen, setIsBroadcastOpen] = useState<boolean>(false);
  const [broadcastPrefix, setBroadcastPrefix] = useState<AnnouncementPriority>('Notice');
  const [broadcastCategory, setBroadcastCategory] = useState<ActivityCategory>('Sports Events');
  const [broadcastVenue, setBroadcastVenue] = useState<string>('Running Track A');
  const [broadcastMessage, setBroadcastMessage] = useState<string>('');
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  // Multi-turn Campus Guide & Navigation Assistant state
  const [isConciergeOpen, setIsConciergeOpen] = useState<boolean>(false);

  const currentActivity =
    activities.find((a) => a.id === selectedActivityId) || activities[0];

  const handleExecuteNavigation = (action: NavigationAction) => {
    switch (action.type) {
      case 'open_schedule':
        setLeftTab('schedule');
        setActiveDrawer(null);
        break;
      case 'open_events':
        setLeftTab('events');
        setActiveDrawer(null);
        break;
      case 'open_map':
        setActiveDrawer('map');
        break;
      case 'open_manager':
        setActiveDrawer('manager');
        break;
      case 'open_broadcast':
        if (canBroadcast) {
          setIsBroadcastOpen(true);
        }
        break;
      case 'focus_activity': {
        if (action.activityId) {
          const target = activities.find((a) => a.id === action.activityId);
          if (target) {
            setSelectedActivityId(target.id);
            setLeftTab('schedule');
            if (typeof target.activeStepIndex === 'number') {
              setActiveStepIndex(target.activeStepIndex);
            }
            if (target.id === 'evt-cultural-symphony') {
              setSelectedEventTitle('Autumn Cultural Fest 2026');
            } else {
              setSelectedEventTitle('Annual Sports Day 2026');
            }
          }
        }
        break;
      }
      default:
        break;
    }
  };

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canBroadcast) return;

    const payload: BroadcastInput = {
      title: broadcastPrefix,
      category: broadcastCategory,
      priority: broadcastPrefix,
      venueName: broadcastVenue,
      eventTimeLabel: '08:00 AM ~ 09:30 AM',
      message: broadcastMessage,
      pinned: true,
    };

    if (onBroadcastAnnouncement) {
      const apiRes = await onBroadcastAnnouncement(payload);
      if (!apiRes.valid) {
        setBroadcastError(apiRes.error || 'Please enter a message to broadcast.');
        return;
      }
      setBroadcastMessage('');
      setBroadcastError(null);
      setIsBroadcastOpen(false);
      return;
    }

    const result = createAnnouncementBroadcast(announcements, payload, member);

    if (!result.valid) {
      setBroadcastError(result.error || 'Please enter a message to broadcast.');
      return;
    }

    onUpdateAnnouncements(result.updatedAnnouncements);
    setBroadcastMessage('');
    setBroadcastError(null);
    setIsBroadcastOpen(false);
  };

  const renderAnnouncementIcon = (iconType: CampusAnnouncement['iconType']) => {
    if (iconType === 'clock') {
      return <AlarmClock className="w-5 h-5 text-[#9CA3AF]" />;
    }
    if (iconType === 'megaphone') {
      return <Megaphone className="w-5 h-5 text-[#9CA3AF]" />;
    }
    return <Lightbulb className="w-5 h-5 text-[#9CA3AF]" />;
  };

  const renderActiveDrawerPanel = () => {
    if (activeDrawer === 'map') {
      return (
        <section
          aria-label="Campus Venue Locations Map"
          className="bg-[#16181D] border border-[#38BDF8]/50 rounded-[20px] p-4 sm:p-5 shadow-lg"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#262A32]">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#38BDF8]" />
              <h3 className="text-sm font-semibold text-white">
                Cultural & Sports Venue Locations
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveDrawer(null)}
              className="min-h-[36px] px-2 text-xs text-[#9CA3AF] hover:text-white cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CAMPUS_VENUES.map((v) => (
              <div
                key={v.id}
                className="p-3.5 rounded-xl bg-[#1D2028] border border-[#2C313D] text-xs"
              >
                <div className="flex items-center justify-between gap-2 text-[#4DA8FF] font-semibold">
                  <span>{v.name}</span>
                  <span className="font-mono-tabular shrink-0">{v.code}</span>
                </div>
                <p className="text-[#D1D5DB] mt-1">{v.addressOrGate}</p>
                <p className="text-[#8E95A2] mt-0.5">{v.statusNote}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    if (activeDrawer === 'manager') {
      return (
        <section
          aria-label="Event Switcher and Role Status"
          className="bg-[#16181D] border border-[#38BDF8]/50 rounded-[20px] p-4 sm:p-5 shadow-lg"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#262A32]">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#38BDF8]" />
              <h3 className="text-sm font-semibold text-white">
                Switch Active Festival / Event Program
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveDrawer(null)}
              className="min-h-[36px] px-2 text-xs text-[#9CA3AF] hover:text-white cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <button
              type="button"
              onClick={() => {
                setSelectedEventTitle('Annual Sports Day 2026');
                setSelectedEventDate('Oct 15, 2026 • Coordinator: Prof. R. Sharma');
                setSelectedActivityId('evt-sprint-heats');
                setActiveStepIndex(2);
              }}
              className={`min-h-[48px] p-3.5 rounded-xl border text-left cursor-pointer ${
                selectedEventTitle === 'Annual Sports Day 2026'
                  ? 'bg-[#172536] border-[#38BDF8] text-white'
                  : 'bg-[#1D2028] border-[#2C313D] text-[#D1D5DB]'
              }`}
            >
              <p className="font-bold">Annual Sports Day 2026</p>
              <p className="text-[#9CA3AF] mt-0.5">Track A, Main Field & Basketball Arena</p>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedEventTitle('Autumn Cultural Fest 2026');
                setSelectedEventDate('Oct 15, 2026 • Coordinator: Prof. R. Sharma');
                setSelectedActivityId('evt-cultural-symphony');
                setActiveStepIndex(2);
              }}
              className={`min-h-[48px] p-3.5 rounded-xl border text-left cursor-pointer ${
                selectedEventTitle === 'Autumn Cultural Fest 2026'
                  ? 'bg-[#172536] border-[#38BDF8] text-white'
                  : 'bg-[#1D2028] border-[#2C313D] text-[#D1D5DB]'
              }`}
            >
              <p className="font-bold">Autumn Cultural Fest 2026</p>
              <p className="text-[#9CA3AF] mt-0.5">Sorrell Cultural Amphitheater & Stage</p>
            </button>
          </div>
        </section>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-[#0D0F12] text-[#E5E7EB] p-3.5 sm:p-6 lg:px-10 lg:py-8 pb-24 lg:pb-8 flex flex-col lg:justify-center">
      {/* Compact Mobile Top App Bar (< 1024px) */}
      <header className="flex lg:hidden items-center justify-between gap-3 pb-3.5 mb-4 border-b border-[#20232A]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            title={`${member.fullName} (${member.campusId})`}
            className="relative w-10 h-10 rounded-full bg-[#262A32] border border-[#383D47] flex items-center justify-center text-xs font-semibold text-[#E5E7EB] shrink-0"
          >
            <span>{member.initials || 'RS'}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80] border-2 border-[#0D0F12] absolute bottom-0 right-0" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {member.fullName}
            </p>
            <p className="text-[11px] font-mono-tabular text-[#4DA8FF] truncate">
              {member.campusId}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          aria-label="Sign Out"
          className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1C1F26] hover:bg-[#282C36] border border-[#2E333E] text-xs font-medium text-[#D1D5DB] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Mobile Drawer Slot right below Mobile Top Bar when toggled */}
      {activeDrawer && (
        <div className="lg:hidden mb-4">
          {renderActiveDrawerPanel()}
        </div>
      )}

      <div className="max-w-[1280px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-7 lg:items-stretch">
        {/* LEFT COLUMN (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-5 h-full">
          {/* Top-Left Card: Events / Schedule Switcher & Annual Sports Day 2026 Header */}
          <section
            aria-label="Event Overview and Schedule Switcher"
            className="bg-[#16181D] border border-[#262A32] rounded-[22px] p-4 sm:p-6 shadow-lg"
          >
            {/* Segmented Pill Switcher: Events | Schedule */}
            <div className="inline-flex items-center bg-[#23262E] p-1 rounded-full w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setLeftTab('events')}
                className={`flex-1 sm:flex-initial min-h-[40px] px-6 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                  leftTab === 'events'
                    ? 'bg-[#172536] text-[#4DA8FF] border border-[#38BDF8] shadow-[0_0_16px_rgba(56,189,248,0.4)]'
                    : 'text-[#9CA3AF] hover:text-white border border-transparent'
                }`}
              >
                Events
              </button>
              <button
                type="button"
                onClick={() => setLeftTab('schedule')}
                className={`flex-1 sm:flex-initial min-h-[40px] px-6 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                  leftTab === 'schedule'
                    ? 'bg-[#172536] text-[#4DA8FF] border border-[#38BDF8] shadow-[0_0_16px_rgba(56,189,248,0.4)]'
                    : 'text-[#9CA3AF] hover:text-white border border-transparent'
                }`}
              >
                Schedule
              </button>
            </div>

            {/* Event Title + Published Pill */}
            <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-2.5 sm:gap-3">
              <h1 className="text-xl sm:text-[26px] font-bold text-white tracking-tight">
                {selectedEventTitle}
              </h1>
              <span className="bg-[#2997FF] text-[#051224] text-xs font-semibold px-3.5 py-1 rounded-full">
                Published
              </span>
            </div>

            {/* Subtitle */}
            <p className="mt-1.5 text-xs sm:text-sm text-[#9CA3AF]">
              {selectedEventDate}
            </p>

            {/* Expanded Schedule View when 'Schedule' tab is active */}
            {leftTab === 'schedule' && (
              <div className="mt-5 pt-4 border-t border-[#262A32] space-y-3">
                <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                  <span>Cultural & Sports Event Schedule</span>
                  <span className="font-mono-tabular">{activities.length} Sessions</span>
                </div>
                {activities.map((act) => {
                  const isReserved = registeredIds.includes(act.id);
                  const isFocused = act.id === selectedActivityId;
                  return (
                    <div
                      key={act.id}
                      className={`p-3.5 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isFocused
                          ? 'bg-[#1C222D] border-[#38BDF8]/60'
                          : 'bg-[#1C1F26] border-[#2B303B]'
                      }`}
                    >
                      <div
                        onClick={() => {
                          setSelectedActivityId(act.id);
                          if (typeof act.activeStepIndex === 'number') {
                            setActiveStepIndex(act.activeStepIndex);
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                          <span className="text-[#4DA8FF] font-medium">{act.category}</span>
                          <span>•</span>
                          <span className="font-mono-tabular">{act.timeRange}</span>
                        </div>
                        <p className="text-sm font-semibold text-white mt-0.5">
                          {act.title}
                        </p>
                        <p className="text-xs text-[#8E95A2] mt-0.5">
                          Venue: {act.locationBuilding} ({act.roomNumber})
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleReservation(act.id)}
                        className={`min-h-[40px] px-3.5 py-2 rounded-full text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                          isReserved
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-[#252932] hover:bg-[#2F3540] text-white border border-[#3A404D]'
                        }`}
                      >
                        {isReserved ? 'Registered ✓' : 'Join Session'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Bottom-Left Card: Announcement Feed */}
          <section
            aria-label="Announcement Feed"
            className="bg-[#16181D] border border-[#262A32] rounded-[22px] p-4 sm:p-6 shadow-lg flex-1 flex flex-col"
          >
            <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-medium text-[#E5E7EB]">
                Announcement
              </h2>

              {/* ONLY Organizers get the + New Broadcast button */}
              {canBroadcast && (
                <button
                  type="button"
                  onClick={() => setIsBroadcastOpen(true)}
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#242830] hover:bg-[#2E333D] border border-[#363B46] text-xs sm:text-sm font-medium text-[#D1D5DB] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Broadcast</span>
                </button>
              )}
            </div>

            <div className="space-y-6 my-auto">
              {announcements.map((ann) => (
                <article
                  key={ann.id}
                  className="flex items-start gap-3.5 sm:gap-4"
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#23272F] flex items-center justify-center shrink-0 mt-0.5">
                    {renderAnnouncementIcon(ann.iconType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-[15px] leading-relaxed text-[#D1D5DB]">
                      <strong className="font-bold text-white">
                        {ann.title}:
                      </strong>{' '}
                      {ann.message}
                    </p>
                    <p className="text-xs text-[#8E95A2] mt-1.5">
                      {ann.publishedAt}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-5 h-full">
          {/* Desktop Top-Right Action Bar aligned with top edge of Left Card */}
          <header className="hidden lg:flex items-center justify-end gap-2.5 pt-3.5 border-t border-[#20232A]">
            <button
              type="button"
              onClick={() =>
                setActiveDrawer((prev) => (prev === 'manager' ? null : 'manager'))
              }
              className={`h-10 inline-flex items-center gap-2 px-4 rounded-full border text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeDrawer === 'manager'
                  ? 'bg-[#172536] border-[#38BDF8] text-[#4DA8FF]'
                  : 'bg-[#23262E] hover:bg-[#2C303A] border-[#343944] text-[#D1D5DB]'
              }`}
            >
              <span>Event Manager</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveDrawer((prev) => (prev === 'map' ? null : 'map'))
              }
              className={`h-10 inline-flex items-center gap-2 px-4 rounded-full border text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeDrawer === 'map'
                  ? 'bg-[#172536] border-[#38BDF8] text-[#4DA8FF]'
                  : 'bg-[#23262E] hover:bg-[#2C303A] border-[#343944] text-[#D1D5DB]'
              }`}
            >
              <MapIcon className="w-4 h-4 text-[#9CA3AF]" />
              <span>Map</span>
            </button>

            <button
              type="button"
              onClick={() => setIsConciergeOpen((prev) => !prev)}
              className={`h-10 inline-flex items-center gap-2 px-4 rounded-full border text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                isConciergeOpen
                  ? 'bg-[#172536] border-[#38BDF8] text-[#4DA8FF] shadow-[0_0_16px_rgba(56,189,248,0.3)]'
                  : 'bg-[#23262E] hover:bg-[#2C303A] border-[#343944] text-[#D1D5DB]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#4DA8FF]" />
              <span>Campus Guide</span>
            </button>

            {/* User Initials Badge + Sign Out Button */}
            <div className="flex items-center gap-2 pl-1">
              <div
                title={`${member.fullName} (${member.campusId})`}
                className="relative w-10 h-10 rounded-full bg-[#262A32] border border-[#383D47] flex items-center justify-center text-sm font-semibold text-[#E5E7EB] shrink-0"
              >
                <span>{member.initials || 'RS'}</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80] border-2 border-[#0D0F12] absolute bottom-0 right-0" />
              </div>

              <button
                type="button"
                onClick={onLogout}
                aria-label="Sign Out"
                title={`Sign Out (${member.campusId})`}
                className="h-10 inline-flex items-center gap-1.5 px-3.5 rounded-full bg-[#1C1F26] hover:bg-[#282C36] border border-[#2E333E] text-xs font-medium text-[#9CA3AF] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </header>

          {/* Desktop Drawer Slot */}
          {activeDrawer && (
            <div className="hidden lg:block">
              {renderActiveDrawerPanel()}
            </div>
          )}

          {/* Main Right Card: Progress & Real-Time + Live Timeline (Gantt) */}
          <section
            aria-label="Progress and Real-Time Timeline"
            className="bg-[#16181D] border border-[#262A32] rounded-[22px] p-4 sm:p-6 shadow-lg flex-1 flex flex-col justify-between relative overflow-hidden"
          >
            <div>
              <h2 className="text-lg sm:text-xl font-medium text-[#E5E7EB]">
                Progress & Real-Time
              </h2>

              {/* Activity Progress Subheader */}
              <div className="mt-3.5 sm:mt-4 flex items-center gap-2 text-xs sm:text-sm text-[#9CA3AF]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2997FF] inline-block" />
                <span>Activity Progress</span>
              </div>

              <h3 className="mt-1 text-lg sm:text-xl font-bold text-white">
                {currentActivity.title}
              </h3>
              <p className="mt-0.5 text-xs sm:text-sm text-[#9CA3AF]">
                {currentActivity.timeRange} • {currentActivity.locationBuilding}
              </p>

              {/* 5-Node Equal-Grid Progress Stepper for Exact Center Alignment */}
              <div className="mt-6 sm:mt-7 mb-6 sm:mb-7 relative">
                {/* Background Track Line from center of Col 1 (10%) to center of Col 5 (90%) */}
                <div className="absolute left-[10%] right-[10%] top-5 h-[2px] bg-[#2E333D]" />
                {/* Active Progress Line */}
                <div
                  className="absolute left-[10%] top-5 h-[2px] bg-[#2997FF] transition-all duration-200"
                  style={{
                    width: `${(activeStepIndex / (PROGRESS_STEPS.length - 1)) * 80}%`,
                  }}
                />

                <div className="relative grid grid-cols-5 items-start">
                  {PROGRESS_STEPS.map((label, idx) => {
                    const isCompleted = idx < activeStepIndex;
                    const isCurrent = idx === activeStepIndex;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setActiveStepIndex(idx)}
                        className="w-full min-h-[44px] flex flex-col items-center text-center group cursor-pointer focus:outline-none"
                      >
                        <span className="h-10 flex items-center justify-center">
                          {isCurrent ? (
                            <span className="w-6 h-6 rounded-full bg-white border-[5px] border-[#2997FF] shadow-[0_0_18px_#38BDF8] flex items-center justify-center transition-transform" />
                          ) : isCompleted ? (
                            <span className="w-6 h-6 rounded-full bg-[#2997FF] flex items-center justify-center transition-transform" />
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-[#323741] group-hover:bg-[#3F4654] flex items-center justify-center transition-colors" />
                          )}
                        </span>

                        <span
                          className={`mt-1 text-[11px] sm:text-xs leading-tight whitespace-pre-line ${
                            isCurrent
                              ? 'font-bold text-white'
                              : 'font-normal text-[#9CA3AF]'
                          }`}
                        >
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live Timeline (Gantt) (Quick-View) with horizontal scroll support on narrow viewports */}
            <div className="pt-2 pb-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base sm:text-lg font-medium text-[#E5E7EB]">
                  Live Timeline (Gantt){' '}
                  <span className="text-[#9CA3AF] font-normal">(Quick-View)</span>
                </h3>
                <span className="text-[11px] text-[#8E95A2] sm:hidden">
                  Swipe →
                </span>
              </div>

              <div className="mt-3 sm:mt-4 overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                <div className="min-w-[440px] sm:min-w-0">
                  {/* Time Column Headers */}
                  <div className="grid grid-cols-12 text-xs text-[#9CA3AF] pb-2.5 border-b border-[#262A32]">
                    <div className="col-span-3" />
                    <div className="col-span-9 grid grid-cols-5 text-center font-mono-tabular">
                      <span>08:00 AM</span>
                      <span>09:00 AM</span>
                      <span>10:00 AM</span>
                      <span>11:00 AM</span>
                      <span>12:00 PM</span>
                    </div>
                  </div>

                  {/* Gantt Chart Rows */}
                  <div className="relative divide-y divide-[#22262E]">
                    {INITIAL_GANTT_ROWS.map((row) => (
                      <div
                        key={row.id}
                        className="grid grid-cols-12 items-center min-h-[54px] py-2"
                      >
                        <div className="col-span-3 pr-2 text-xs sm:text-sm text-[#D1D5DB] font-medium">
                          {row.venueLabel}
                        </div>
                        <div className="col-span-9 relative h-9 flex items-center">
                          {/* Subtle vertical grid lines */}
                          <div className="absolute inset-0 grid grid-cols-5 pointer-events-none">
                            <div className="border-l border-[#22262E]" />
                            <div className="border-l border-[#22262E]" />
                            <div className="border-l border-[#22262E]" />
                            <div className="border-l border-[#22262E]" />
                            <div className="border-l border-[#22262E]" />
                          </div>

                          {/* Vertical Current-Time Indicator Line aligned at 25% of the timeline track */}
                          <div
                            aria-hidden="true"
                            className="absolute -top-2.5 -bottom-2.5 left-[25%] w-[2px] bg-[#38BDF8]/80 z-10 pointer-events-none"
                          />

                          {row.bars.map((bar) => (
                            <div
                              key={bar.id}
                              style={{
                                marginLeft: `${bar.startCol}%`,
                                width: `${bar.widthPct}%`,
                              }}
                              className={`relative z-20 px-3 py-1.5 rounded-lg text-xs font-medium truncate flex items-center gap-1.5 ${
                                bar.isConflict
                                  ? 'bg-[#1D2837] border border-[#4E7BB0] text-[#93C5FD] shadow-[0_0_12px_rgba(56,189,248,0.18)]'
                                  : 'bg-[#232832] border border-[#343B48] text-[#D1D5DB]'
                              }`}
                            >
                              {bar.isConflict && (
                                <AlertTriangle className="w-3.5 h-3.5 text-[#93C5FD] shrink-0" />
                              )}
                              <span className="truncate">{bar.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom-Right Glowing Action Orb matching template */}
            <button
              type="button"
              onClick={() => setIsConciergeOpen((prev) => !prev)}
              title="Open Campus Guide & Event Assistant"
              aria-label="Open Campus Guide & Event Assistant"
              className="absolute bottom-3.5 right-3.5 z-30 w-12 h-12 rounded-full bg-[#18293B] border border-[#38BDF8] shadow-[0_0_24px_rgba(56,189,248,0.5)] flex items-center justify-center text-[#58B9FF] hover:scale-105 transition-transform cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </section>
        </div>
      </div>

      {/* Multi-turn Gemini Campus Guide & Navigation Assistant */}
      <CampusConciergeChat
        isOpen={isConciergeOpen}
        onClose={() => setIsConciergeOpen(false)}
        member={member}
        activities={activities}
        canBroadcast={canBroadcast}
        onExecuteNavigation={handleExecuteNavigation}
      />

      {/* Ergonomic Mobile Bottom Navigation Bar (< 1024px) */}
      <nav
        aria-label="Mobile Quick Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#12151B]/95 backdrop-blur-md border-t border-[#262A32] px-2"
      >
        <div className="grid grid-cols-3 items-center h-16 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => {
              setLeftTab('events');
              setActiveDrawer(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer ${
              leftTab === 'events' && !activeDrawer
                ? 'text-[#4DA8FF]'
                : 'text-[#9CA3AF]'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Overview</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLeftTab('schedule');
              setActiveDrawer(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer ${
              leftTab === 'schedule' && !activeDrawer
                ? 'text-[#4DA8FF]'
                : 'text-[#9CA3AF]'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Schedule</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveDrawer((prev) => (prev === 'map' ? null : 'map'));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`min-h-[48px] flex flex-col items-center justify-center cursor-pointer ${
              activeDrawer === 'map' ? 'text-[#4DA8FF]' : 'text-[#9CA3AF]'
            }`}
          >
            <MapIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Venues</span>
          </button>
        </div>
      </nav>

      {/* Organizer "+ New Broadcast" Modal / Mobile Bottom Sheet */}
      {canBroadcast && isBroadcastOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-broadcast-modal-title"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4"
        >
          <div className="bg-[#16181D] border-t sm:border border-[#2E3440] rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 text-[#E5E7EB] shadow-2xl">
            {/* Mobile Sheet Grab Handle */}
            <div className="w-10 h-1.5 bg-[#323742] rounded-full mx-auto mb-3 sm:hidden" />

            <div className="flex items-center justify-between pb-3.5 border-b border-[#262A32]">
              <h2 id="new-broadcast-modal-title" className="text-lg font-bold text-white">
                New Event Broadcast
              </h2>
              <button
                type="button"
                onClick={() => setIsBroadcastOpen(false)}
                aria-label="Close broadcast dialog"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[#9CA3AF] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="bc-prefix"
                    className="block text-xs text-[#9CA3AF] mb-1"
                  >
                    Alert Type
                  </label>
                  <select
                    id="bc-prefix"
                    value={broadcastPrefix}
                    onChange={(e) =>
                      setBroadcastPrefix(e.target.value as AnnouncementPriority)
                    }
                    className="w-full min-h-[44px] px-3 py-2 text-sm bg-[#22262E] border border-[#343944] rounded-xl text-white focus:outline-none focus:border-[#38BDF8]"
                  >
                    <option value="Notice">Notice</option>
                    <option value="Volunteers">Volunteers</option>
                    <option value="Reminder">Reminder</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="bc-category"
                    className="block text-xs text-[#9CA3AF] mb-1"
                  >
                    Category
                  </label>
                  <select
                    id="bc-category"
                    value={broadcastCategory}
                    onChange={(e) =>
                      setBroadcastCategory(e.target.value as ActivityCategory)
                    }
                    className="w-full min-h-[44px] px-3 py-2 text-sm bg-[#22262E] border border-[#343944] rounded-xl text-white focus:outline-none focus:border-[#38BDF8]"
                  >
                    <option value="Sports Events">Sports Events</option>
                    <option value="Cultural Events">Cultural Events</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="bc-venue"
                  className="block text-xs text-[#9CA3AF] mb-1"
                >
                  Affected Venue Location
                </label>
                <select
                  id="bc-venue"
                  value={broadcastVenue}
                  onChange={(e) => setBroadcastVenue(e.target.value)}
                  className="w-full min-h-[44px] px-3 py-2 text-sm bg-[#22262E] border border-[#343944] rounded-xl text-white focus:outline-none focus:border-[#38BDF8]"
                >
                  {CAMPUS_VENUES.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name} ({v.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="bc-message"
                  className="block text-xs text-[#9CA3AF] mb-1"
                >
                  Broadcast Message
                </label>
                <textarea
                  id="bc-message"
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g., Relay schedule shifted by 15 mins due to rain. Track A affected."
                  className="w-full px-3.5 py-2.5 text-sm bg-[#22262E] border border-[#343944] rounded-xl text-white focus:outline-none focus:border-[#38BDF8]"
                />
              </div>

              {broadcastError && (
                <p role="alert" className="text-xs text-rose-400">
                  {broadcastError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBroadcastOpen(false)}
                  className="min-h-[44px] px-4 py-2 rounded-full text-xs font-medium text-[#9CA3AF] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 rounded-full text-xs font-semibold bg-[#2997FF] hover:bg-[#47A8FF] text-[#051224] cursor-pointer"
                >
                  Publish Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
