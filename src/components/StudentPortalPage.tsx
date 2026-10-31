import React, { useState, useMemo } from 'react';
import {
  Bell,
  Calendar,
  Check,
  LogOut,
  MapPin,
  RotateCcw,
  Search,
} from 'lucide-react';
import {
  ActivityCategory,
  CAMPUS_VENUES,
  CampusActivity,
  CampusAnnouncement,
  CampusMember,
} from '../data/campusData';
import { filterActivities } from '../utils/campusAuth';
import { ActivityArtwork } from './CampusIllustrations';

interface StudentPortalPageProps {
  member: CampusMember;
  announcements: CampusAnnouncement[];
  activities: CampusActivity[];
  registeredIds: string[];
  onToggleReservation: (activityId: string) => void;
  onLogout: () => void;
}

const EVENT_CATEGORIES: ('All' | ActivityCategory)[] = [
  'All',
  'Cultural Events',
  'Sports Events',
];

const DAY_OPTIONS = ['All', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const StudentPortalPage: React.FC<StudentPortalPageProps> = ({
  member,
  announcements,
  activities,
  registeredIds,
  onToggleReservation,
  onLogout,
}) => {
  const [announcementCategory, setAnnouncementCategory] = useState<'All' | ActivityCategory>('All');
  const [scheduleCategory, setScheduleCategory] = useState<'All' | ActivityCategory>('All');
  const [selectedDay, setSelectedDay] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [venueCategory, setVenueCategory] = useState<'All' | ActivityCategory>('All');
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) =>
      announcementCategory === 'All' ? true : ann.category === announcementCategory
    );
  }, [announcements, announcementCategory]);

  const filteredSchedule = useMemo(() => {
    const base = filterActivities(activities, {
      category: scheduleCategory,
      dayOfWeek: selectedDay,
      searchQuery,
      onlyOpenSeats: false,
    });
    if (!selectedVenueId) return base;
    return base.filter((act) => act.venueId === selectedVenueId);
  }, [activities, scheduleCategory, selectedDay, searchQuery, selectedVenueId]);

  const filteredVenues = useMemo(() => {
    return CAMPUS_VENUES.filter((v) =>
      venueCategory === 'All' ? true : v.category === venueCategory
    );
  }, [venueCategory]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-8 px-6 py-4">
          <a
            href="#student-top"
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Alderbrook Commons
          </a>

          <nav
            aria-label="Student Portal Navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            <a
              href="#announcements-section"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Announcements
            </a>
            <a
              href="#schedules-section"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Event Schedules
            </a>
            <a
              href="#venues-section"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Venue Locations
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

      <main id="student-top" className="flex-1">
        {/* Student Welcome & Summary Header */}
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-[1360px] mx-auto px-6 py-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                  <span>Verified Student Portal</span>
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
                  Cultural & Sports Event Announcements, Schedules & Venues
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-6 sm:gap-8 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-200 shrink-0">
                <div>
                  <p className="text-xs text-slate-500 whitespace-nowrap">Live Broadcasts</p>
                  <p className="text-xl font-bold font-mono-tabular text-slate-900 mt-0.5 whitespace-nowrap">
                    {announcements.length} Active
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 whitespace-nowrap">Scheduled Events</p>
                  <p className="text-xl font-bold font-mono-tabular text-slate-900 mt-0.5 whitespace-nowrap">
                    {activities.length} Sessions
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 whitespace-nowrap">My Reserved Spots</p>
                  <p className="text-xl font-bold font-mono-tabular text-amber-700 mt-0.5 whitespace-nowrap">
                    {registeredIds.length} Reserved
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Announcements of Cultural & Sports Events */}
        <section id="announcements-section" className="py-10">
          <div className="max-w-[1360px] mx-auto px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  01. Official Organizer Broadcast Feed
                </p>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
                  Cultural & Sports Announcements
                </h2>
              </div>

              <div
                role="group"
                aria-label="Filter announcements by category"
                className="flex items-center gap-1 p-1 bg-slate-200/75 rounded-lg self-start sm:self-auto"
              >
                {EVENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setAnnouncementCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      announcementCategory === cat
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat === 'All' ? 'All Broadcasts' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredAnnouncements.map((ann) => (
                <article
                  key={ann.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <div className="flex flex-wrap items-center gap-1.5">
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
                      </div>
                      <span className="font-mono-tabular">{ann.publishedAt}</span>
                    </div>

                    <h3 className="mt-2 text-lg font-bold text-slate-900 leading-snug">
                      {ann.title}
                    </h3>

                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {ann.message}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400">Venue: </span>
                      <span className="font-semibold text-slate-800">
                        {ann.venueName}
                      </span>
                      <span className="mx-1.5" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-mono-tabular">{ann.eventTimeLabel}</span>
                    </div>
                    <span className="text-slate-500 font-mono-tabular">
                      By {ann.authorId}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Schedules of Cultural & Sports Events */}
        <section
          id="schedules-section"
          className="py-10 bg-white border-t border-slate-200"
        >
          <div className="max-w-[1360px] mx-auto px-6">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-200">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  02. Upcoming Cultural & Athletics Timetable
                </p>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
                  Event Schedules & Seat Registration
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div
                  role="group"
                  aria-label="Filter schedule by category"
                  className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
                >
                  {EVENT_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setScheduleCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        scheduleCategory === cat
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cat === 'All' ? 'All Events' : cat}
                    </button>
                  ))}
                </div>

                <div className="relative w-56">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    aria-label="Search cultural and sports events"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search event or venue..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
                  />
                </div>

                <select
                  aria-label="Filter schedule by day"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {DAY_OPTIONS.map((day) => (
                    <option key={day} value={day}>
                      {day === 'All' ? 'All Days' : day}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedVenueId && (
              <div className="mt-4 p-3 bg-slate-100 rounded-xl flex items-center justify-between text-xs">
                <span>
                  Showing scheduled events at{' '}
                  <strong className="text-slate-900">
                    {CAMPUS_VENUES.find((v) => v.id === selectedVenueId)?.name}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedVenueId(null)}
                  className="font-semibold text-slate-900 underline cursor-pointer"
                >
                  Show All Venues
                </button>
              </div>
            )}

            {filteredSchedule.length === 0 ? (
              <div className="mt-6 p-10 border border-slate-200 rounded-2xl bg-slate-50 text-center">
                <Calendar className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-900 mt-2">
                  No cultural or sports events match your current filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setScheduleCategory('All');
                    setSelectedDay('All');
                    setSearchQuery('');
                    setSelectedVenueId(null);
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Schedule Filters</span>
                </button>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSchedule.map((evt) => {
                  const isReserved = registeredIds.includes(evt.id);
                  const openSeats = Math.max(0, evt.capacity - evt.enrolledCount);
                  return (
                    <article
                      key={evt.id}
                      className="border border-slate-200 rounded-2xl overflow-hidden bg-white flex flex-col justify-between"
                    >
                      <div>
                        <ActivityArtwork
                          type={evt.illustrationType}
                          category={evt.category}
                        />
                        <div className="p-5">
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                            <span className="font-semibold text-slate-900">
                              {evt.dateLabel}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-tabular">{evt.timeRange}</span>
                            <span aria-hidden="true">·</span>
                            <span>{evt.category}</span>
                          </div>

                          <h3 className="mt-2 text-lg font-bold text-slate-900 leading-snug">
                            {evt.title}
                          </h3>

                          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                            {evt.summary}
                          </p>

                          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                            <div>
                              <span className="text-slate-400">Venue Location: </span>
                              <span className="font-semibold text-slate-800">
                                {evt.locationBuilding} · {evt.roomNumber}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Organizer: </span>
                              <span>
                                {evt.hostOrganization} ({evt.hostAdvisorOrLead})
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                        <div className="text-xs">
                          <span className="font-mono-tabular font-bold text-slate-900">
                            {evt.enrolledCount} / {evt.capacity}
                          </span>
                          <span className="text-slate-500 ml-1">
                            ({openSeats} open)
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onToggleReservation(evt.id)}
                          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 cursor-pointer ${
                            isReserved
                              ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          {isReserved ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Registered · Cancel</span>
                            </>
                          ) : (
                            <span>Register with Student ID</span>
                          )}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Venue Locations of Cultural & Sports Events */}
        <section
          id="venues-section"
          className="py-10 bg-slate-50 border-t border-slate-200"
        >
          <div className="max-w-[1360px] mx-auto px-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-200">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  03. Campus Precinct & Gate Directory
                </p>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
                  Cultural & Sports Venue Locations
                </h2>
              </div>

              <div
                role="group"
                aria-label="Filter venues by category"
                className="flex items-center gap-1 p-1 bg-slate-200/75 rounded-lg self-start sm:self-auto"
              >
                {EVENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setVenueCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      venueCategory === cat
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat === 'All' ? 'All Venues' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredVenues.map((venue) => {
                const venueEvents = activities.filter((a) => a.venueId === venue.id);
                return (
                  <div
                    key={venue.id}
                    className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-800">
                          {venue.category} · {venue.precinct}
                        </span>
                        <span className="font-mono-tabular font-semibold text-slate-900">
                          {venue.code}
                        </span>
                      </div>

                      <h3 className="mt-1.5 text-xl font-bold text-slate-900">
                        {venue.name}
                      </h3>

                      <p className="mt-1 text-xs font-medium text-amber-800">
                        Entry & Gate: {venue.addressOrGate} · {venue.coordinatesLabel}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                        <div>
                          <span className="text-slate-400">Stage / Surface: </span>
                          <span>{venue.surfaceOrAcoustics}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Facilities & Access: </span>
                          <span>{venue.facilities}</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-800 mb-1.5">
                          Scheduled Events at this Venue ({venueEvents.length})
                        </p>
                        <ul className="space-y-1 text-xs text-slate-600">
                          {venueEvents.map((ev) => (
                            <li
                              key={ev.id}
                              className="flex items-center justify-between gap-2"
                            >
                              <span className="truncate font-medium text-slate-800">
                                {ev.title}
                              </span>
                              <span className="font-mono-tabular text-slate-500 shrink-0">
                                {ev.dateLabel} · {ev.timeRange}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
                      <span className="text-xs text-slate-600">
                        Max Capacity:{' '}
                        <strong className="font-mono-tabular text-slate-900">
                          {venue.capacity} seats
                        </strong>
                      </span>

                      <a
                        href="#schedules-section"
                        onClick={() => setSelectedVenueId(venue.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Filter Schedule by Venue</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
