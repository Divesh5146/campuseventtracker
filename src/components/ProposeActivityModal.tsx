import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import {
  ActivityCategory,
  CAMPUS_VENUES,
  CampusActivity,
  CampusMember,
} from '../data/campusData';

interface ProposeActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMember: CampusMember | null;
  onAddActivity: (newActivity: CampusActivity) => void;
}

export const ProposeActivityModal: React.FC<ProposeActivityModalProps> = ({
  isOpen,
  onClose,
  activeMember,
  onAddActivity,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('Cultural Events');
  const [hostOrganization, setHostOrganization] = useState(
    activeMember?.department || 'Campus Cultural & Sports Board'
  );
  const [dayOfWeek, setDayOfWeek] = useState<CampusActivity['dayOfWeek']>('Friday');
  const [timeRange, setTimeRange] = useState('18:00 – 20:30');
  const [venueId, setVenueId] = useState(CAMPUS_VENUES[0].id);
  const [roomNumber, setRoomNumber] = useState('Main Stage');
  const [capacity, setCapacity] = useState('120');
  const [summary, setSummary] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) {
      setFormError('Please provide an event title and schedule description.');
      return;
    }

    const selectedVenue =
      CAMPUS_VENUES.find((v) => v.id === venueId) || CAMPUS_VENUES[0];
    const capNum = Math.max(10, Math.min(1200, Number(capacity) || 120));

    const created: CampusActivity = {
      id: `evt-custom-${Date.now()}`,
      title: title.trim(),
      category,
      hostOrganization: hostOrganization.trim() || 'Campus Cultural & Sports Board',
      hostAdvisorOrLead: activeMember
        ? `${activeMember.fullName} · ${activeMember.campusId}`
        : 'Campus Organizer',
      dayOfWeek,
      dateLabel: `${dayOfWeek.slice(0, 3)}, Nov 6`,
      timeRange: timeRange.trim() || '18:00 – 20:30',
      venueId: selectedVenue.id,
      locationBuilding: selectedVenue.name,
      roomNumber: roomNumber.trim() || selectedVenue.addressOrGate,
      coCurricularHours: 2.5,
      capacity: capNum,
      enrolledCount: 1,
      checkInCode: `EVT-${Math.floor(10 + Math.random() * 89)}`,
      summary: summary.trim(),
      equipmentOrPrerequisites: 'Student ID required at venue entry',
      illustrationType: category === 'Cultural Events' ? 'symphony' : 'rowing',
    };

    onAddActivity(created);
    setTitle('');
    setSummary('');
    setFormError(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="propose-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 lg:p-7 shadow-xl">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Organizer ID: {activeMember ? activeMember.campusId : 'ORG-2026-0310'}
            </p>
            <h2 id="propose-modal-title" className="text-xl font-bold text-slate-900 mt-0.5">
              Publish Cultural or Sports Event
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close event dialog"
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="prop-title" className="block text-xs font-semibold text-slate-800 mb-1">
              Event Title
            </label>
            <input
              id="prop-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Inter-House Table Tennis & Badminton Open"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prop-category" className="block text-xs font-semibold text-slate-800 mb-1">
                Category
              </label>
              <select
                id="prop-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              >
                <option value="Cultural Events">Cultural Events</option>
                <option value="Sports Events">Sports Events</option>
              </select>
            </div>
            <div>
              <label htmlFor="prop-org" className="block text-xs font-semibold text-slate-800 mb-1">
                Organizing Committee
              </label>
              <input
                id="prop-org"
                type="text"
                value={hostOrganization}
                onChange={(e) => setHostOrganization(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="prop-day" className="block text-xs font-semibold text-slate-800 mb-1">
                Day of Week
              </label>
              <select
                id="prop-day"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value as CampusActivity['dayOfWeek'])}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              >
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
              </select>
            </div>
            <div>
              <label htmlFor="prop-time" className="block text-xs font-semibold text-slate-800 mb-1">
                Time Slot
              </label>
              <input
                id="prop-time"
                type="text"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono-tabular bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>
            <div>
              <label htmlFor="prop-capacity" className="block text-xs font-semibold text-slate-800 mb-1">
                Seat Capacity
              </label>
              <input
                id="prop-capacity"
                type="number"
                min="10"
                max="1200"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono-tabular bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="prop-venue" className="block text-xs font-semibold text-slate-800 mb-1">
                Campus Venue Location
              </label>
              <select
                id="prop-venue"
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              >
                {CAMPUS_VENUES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="prop-room" className="block text-xs font-semibold text-slate-800 mb-1">
                Gate / Court / Stage
              </label>
              <input
                id="prop-room"
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="prop-summary" className="block text-xs font-semibold text-slate-800 mb-1">
              Event Description
            </label>
            <textarea
              id="prop-summary"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Provide details on cultural performances, sports brackets, or spectator entry..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          {formError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Publish to Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
