import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  LogOut,
  Megaphone,
  Pin,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  ActivityCategory,
  AnnouncementPriority,
  CAMPUS_VENUES,
  CampusActivity,
  CampusAnnouncement,
  CampusMember,
} from '../data/campusData';
import { createAnnouncementBroadcast } from '../utils/campusAuth';

interface OrganizerPortalPageProps {
  member: CampusMember;
  announcements: CampusAnnouncement[];
  activities: CampusActivity[];
  onUpdateAnnouncements: (next: CampusAnnouncement[]) => void;
  onOpenPublishEventModal: () => void;
  onLogout: () => void;
}

export const OrganizerPortalPage: React.FC<OrganizerPortalPageProps> = ({
  member,
  announcements,
  activities,
  onUpdateAnnouncements,
  onOpenPublishEventModal,
  onLogout,
}) => {
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<ActivityCategory>('Cultural Events');
  const [priority, setPriority] = useState<AnnouncementPriority>('Schedule / Venue Update');
  const [venueName, setVenueName] = useState<string>(
    `${CAMPUS_VENUES[0].name} (${CAMPUS_VENUES[0].code.split(' ')[0]})`
  );
  const [eventTimeLabel, setEventTimeLabel] = useState<string>('Fri, Nov 6 · 18:00 – 21:00');
  const [message, setMessage] = useState<string>('');
  const [pinned, setPinned] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = createAnnouncementBroadcast(
      announcements,
      {
        title,
        category,
        priority,
        venueName,
        eventTimeLabel,
        message,
        pinned,
      },
      member
    );

    if (!result.valid || !result.announcement) {
      setFeedback({
        type: 'error',
        text: result.error || 'Please complete all required announcement fields.',
      });
      return;
    }

    onUpdateAnnouncements(result.updatedAnnouncements);
    setTitle('');
    setMessage('');
    setFeedback({
      type: 'success',
      text: `Broadcast published: "${result.announcement.title}" is now live on the Student Portal feed.`,
    });
  };

  const handleTogglePin = (id: string) => {
    const updated = announcements.map((ann) =>
      ann.id === id ? { ...ann, pinned: !ann.pinned } : ann
    );
    onUpdateAnnouncements(updated);
  };

  const handleDeleteAnnouncement = (id: string) => {
    const updated = announcements.filter((ann) => ann.id !== id);
    onUpdateAnnouncements(updated);
  };

  const fillTemplate = (templateType: 'cultural' | 'sports') => {
    if (templateType === 'cultural') {
      setTitle('Acoustic Soundcheck & Balcony Seating Open: Chamber Symphony Gala');
      setCategory('Cultural Events');
      setPriority('Schedule / Venue Update');
      setVenueName('Sorrell Timber Recital Hall (BLDG-14)');
      setEventTimeLabel('Wed, Nov 4 · 19:00 – 21:30');
      setMessage(
        'Additional 40 balcony seats have been released for Student ID holders at East Colonnade Gate B. Doors open at 18:30.'
      );
      setFeedback(null);
    } else {
      setTitle('Court Assignment Update: Chancellor’s Cup 5v5 Basketball Finals');
      setCategory('Sports Events');
      setPriority('Urgent Broadcast');
      setVenueName('Kimball Indoor Sports Arena & Track (ATH-01)');
      setEventTimeLabel('Sat, Nov 7 · 15:00 – 18:30');
      setMessage(
        'Team captains must report to the North Turnstile scorer’s table 25 minutes before tip-off with verified Student ID rosters.'
      );
      setFeedback(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-8 px-6 py-4">
          <a
            href="#organizer-top"
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Alderbrook Commons
          </a>

          <nav
            aria-label="Organizer Portal Navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            <a
              href="#broadcast-studio"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Broadcast Studio
            </a>
            <a
              href="#published-broadcasts"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Published Feed
            </a>
            <a
              href="#organizer-schedule"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Event Schedule
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="font-mono-tabular">{member.campusId}</span>
              <span aria-hidden="true">·</span>
              <span>Sign Out</span>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main id="organizer-top" className="flex-1">
        {/* Organizer Header Banner */}
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-[1360px] mx-auto px-6 py-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                  <span>Verified Event Organizer Console</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular font-semibold text-slate-800">
                    {member.campusId}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{member.fullName}</span>
                </div>
                <h1
                  className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900"
                  style={{ textWrap: 'balance' }}
                >
                  Campus Event Broadcast Studio & Schedule Dispatch
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenPublishEventModal}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Cultural / Sports Event</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Broadcast Studio & Live Feed Split */}
        <section id="broadcast-studio" className="py-10">
          <div className="max-w-[1360px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left 6 Cols: Broadcast Announcement Composer */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 lg:p-7">
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      01. Instant Campus Dispatch
                    </p>
                    <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                      Broadcast Event Announcement
                    </h2>
                  </div>
                  <Megaphone className="w-5 h-5 text-slate-700 shrink-0" />
                </div>

                {/* Quick Template Presets */}
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-500">Quick-fill template:</span>
                  <button
                    type="button"
                    onClick={() => fillTemplate('cultural')}
                    className="font-semibold text-slate-800 underline hover:text-slate-950 cursor-pointer"
                  >
                    Cultural Venue Update
                  </button>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => fillTemplate('sports')}
                    className="font-semibold text-slate-800 underline hover:text-slate-950 cursor-pointer"
                  >
                    Sports Court Call
                  </button>
                </div>

                <form onSubmit={handleBroadcastSubmit} noValidate className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor="broadcast-title"
                      className="block text-xs font-semibold text-slate-800 mb-1"
                    >
                      Announcement Headline
                    </label>
                    <input
                      id="broadcast-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Gate Change: Lantern Dramatic Arts Festival Moves to Sorrell Hall"
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="broadcast-category"
                        className="block text-xs font-semibold text-slate-800 mb-1"
                      >
                        Event Category
                      </label>
                      <select
                        id="broadcast-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                      >
                        <option value="Cultural Events">Cultural Events</option>
                        <option value="Sports Events">Sports Events</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="broadcast-priority"
                        className="block text-xs font-semibold text-slate-800 mb-1"
                      >
                        Broadcast Priority
                      </label>
                      <select
                        id="broadcast-priority"
                        value={priority}
                        onChange={(e) =>
                          setPriority(e.target.value as AnnouncementPriority)
                        }
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                      >
                        <option value="Standard Notice">Standard Notice</option>
                        <option value="Schedule / Venue Update">
                          Schedule / Venue Update
                        </option>
                        <option value="Urgent Broadcast">Urgent Broadcast</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="broadcast-venue"
                        className="block text-xs font-semibold text-slate-800 mb-1"
                      >
                        Venue Location
                      </label>
                      <select
                        id="broadcast-venue"
                        value={venueName}
                        onChange={(e) => setVenueName(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                      >
                        {CAMPUS_VENUES.map((v) => {
                          const label = `${v.name} (${v.code.split(' ')[0]})`;
                          return (
                            <option key={v.id} value={label}>
                              {label}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="broadcast-time"
                        className="block text-xs font-semibold text-slate-800 mb-1"
                      >
                        Event Date & Time Slot
                      </label>
                      <input
                        id="broadcast-time"
                        type="text"
                        value={eventTimeLabel}
                        onChange={(e) => setEventTimeLabel(e.target.value)}
                        placeholder="e.g., Fri, Nov 6 · 18:00 – 21:00"
                        className="w-full px-3.5 py-2 text-sm font-mono-tabular bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="broadcast-message"
                      className="block text-xs font-semibold text-slate-800 mb-1"
                    >
                      Announcement Details & Instructions
                    </label>
                    <textarea
                      id="broadcast-message"
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write schedule updates, entry gate instructions, warm-up call times, or equipment requirements for students..."
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pinned}
                        onChange={(e) => setPinned(e.target.checked)}
                        className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <span>Pin announcement to top of Student Portal</span>
                    </label>
                    <span className="text-xs font-mono-tabular text-slate-500">
                      Sender: {member.campusId}
                    </span>
                  </div>

                  {feedback && (
                    <div
                      role="alert"
                      className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                        feedback.type === 'success'
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          : 'bg-rose-50 text-rose-900 border border-rose-200'
                      }`}
                    >
                      {feedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                      )}
                      <span>{feedback.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Megaphone className="w-4 h-4" />
                    <span>Broadcast Announcement to Campus</span>
                  </button>
                </form>
              </div>

              {/* Right 6 Cols: Active Broadcast Feed Management */}
              <div id="published-broadcasts" className="lg:col-span-6 space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        02. Active Broadcast Queue ({announcements.length})
                      </p>
                      <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                        Published Event Announcements
                      </h2>
                    </div>
                  </div>

                  <div className="mt-4 divide-y divide-slate-200">
                    {announcements.map((ann) => (
                      <div key={ann.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900">
                              {ann.category}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={
                                ann.priority === 'Urgent Broadcast'
                                  ? 'text-rose-700 font-semibold'
                                  : ann.priority === 'Schedule / Venue Update'
                                  ? 'text-amber-800 font-semibold'
                                  : 'text-slate-600'
                              }
                            >
                              {ann.priority}
                            </span>
                            {ann.pinned && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-emerald-700 font-semibold">
                                  Pinned
                                </span>
                              </>
                            )}
                          </div>
                          <span className="font-mono-tabular">{ann.publishedAt}</span>
                        </div>

                        <h3 className="mt-1.5 text-base font-bold text-slate-900">
                          {ann.title}
                        </h3>

                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                          {ann.message}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                          <span>
                            {ann.venueName} ·{' '}
                            <span className="font-mono-tabular">
                              {ann.eventTimeLabel}
                            </span>
                          </span>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleTogglePin(ann.id)}
                              className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-950 font-medium cursor-pointer"
                            >
                              <Pin className="w-3.5 h-3.5" />
                              <span>{ann.pinned ? 'Unpin' : 'Pin'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAnnouncement(ann.id)}
                              aria-label={`Delete announcement ${ann.title}`}
                              className="inline-flex items-center gap-1 text-rose-700 hover:text-rose-900 font-medium cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Organizer Schedule Overview Table */}
        <section
          id="organizer-schedule"
          className="py-10 bg-white border-t border-slate-200"
        >
          <div className="max-w-[1360px] mx-auto px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  03. Master Cultural & Sports Event Roster
                </p>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
                  Scheduled Events & Venue Assignments
                </h2>
              </div>
              <button
                type="button"
                onClick={onOpenPublishEventModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Publish New Event</span>
              </button>
            </div>

            <div className="mt-6 border border-slate-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="py-3.5 px-5">Event Title</th>
                      <th className="py-3.5 px-5">Category</th>
                      <th className="py-3.5 px-5">Date & Time</th>
                      <th className="py-3.5 px-5">Venue Location</th>
                      <th className="py-3.5 px-5 text-right">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {activities.map((act) => (
                      <tr key={act.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-5 font-semibold text-slate-900">
                          {act.title}
                        </td>
                        <td className="py-3.5 px-5 text-xs text-slate-600">
                          {act.category}
                        </td>
                        <td className="py-3.5 px-5 font-mono-tabular text-xs text-slate-700 whitespace-nowrap">
                          {act.dateLabel} · {act.timeRange}
                        </td>
                        <td className="py-3.5 px-5 text-xs text-slate-700">
                          {act.locationBuilding} · {act.roomNumber}
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono-tabular text-xs font-semibold text-slate-900">
                          {act.enrolledCount} / {act.capacity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
