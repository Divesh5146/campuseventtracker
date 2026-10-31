import React, { useState } from 'react';
import {
  IdCard,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import {
  CampusMember,
  CampusRole,
  DEMO_CAMPUS_MEMBERS,
} from '../data/campusData';
import {
  normalizeCampusId,
  validateCampusLogin,
} from '../utils/campusAuth';

interface IdLoginCardProps {
  activeMember: CampusMember | null;
  onLoginSuccess: (member: CampusMember) => void;
  onLogin?: (
    campusId: string,
    role: CampusRole
  ) => Promise<{ valid: boolean; error?: string }>;
  onLogout: () => void;
  registeredCount: number;
  verifiedHours: number;
  onVerifyCheckIn: (code: string) => { success: boolean; message: string };
  idInputRef: React.RefObject<HTMLInputElement | null>;
}

const ROLE_OPTIONS: { id: CampusRole; label: string; prefix: string }[] = [
  { id: 'student', label: 'Student ID', prefix: 'STU' },
  { id: 'organization', label: 'Organizer ID', prefix: 'ORG' },
];

export const IdLoginCard: React.FC<IdLoginCardProps> = ({
  onLoginSuccess,
  onLogin,
  idInputRef,
}) => {
  const [selectedRole, setSelectedRole] = useState<CampusRole>('student');
  const [campusIdInput, setCampusIdInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSelectDemoMember = (member: CampusMember) => {
    setSelectedRole(member.role);
    setCampusIdInput(member.campusId);
    setErrorMessage(null);
  };

  const handleRoleSwitch = (role: CampusRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin) {
      setIsSubmitting(true);
      try {
        const apiResult = await onLogin(campusIdInput, selectedRole);
        if (!apiResult.valid) {
          setErrorMessage(
            apiResult.error || 'Unable to verify Campus ID credentials.'
          );
          return;
        }
        setErrorMessage(null);
      } catch {
        setErrorMessage('Unable to connect to authentication server.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const result = validateCampusLogin(campusIdInput, selectedRole);
    if (!result.valid || !result.member) {
      setErrorMessage(result.error || 'Unable to verify Campus ID credentials.');
      return;
    }

    setErrorMessage(null);
    onLoginSuccess(result.member);
  };

  const normalizedPreview = normalizeCampusId(campusIdInput, selectedRole);
  const matchedMember = DEMO_CAMPUS_MEMBERS.find(
    (m) => m.campusId === normalizedPreview && m.role === selectedRole
  );

  return (
    <section
      aria-label="Campus ID Sign In Portal"
      className="relative overflow-hidden bg-[#12151C]/95 backdrop-blur-xl border border-[#242936] rounded-[24px] p-6 sm:p-7 flex flex-col justify-between shadow-[0_24px_64px_rgba(0,0,0,0.65)] text-[#E5E7EB]"
    >
      {/* Subtle top iridescent pass edge */}
      <div
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-[3px] transition-colors duration-300 ${
          selectedRole === 'student'
            ? 'bg-gradient-to-r from-[#2997FF] via-[#38BDF8] to-[#818CF8]'
            : 'bg-gradient-to-r from-[#38BDF8] via-[#34D399] to-[#2997FF]'
        }`}
      />

      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#222733]">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#94A3B8]">
              <span>Alderbrook Commons</span>
              <span aria-hidden="true">·</span>
              <span>Campus Activity Platform</span>
            </div>
            <h1 className="text-xl sm:text-[22px] font-bold tracking-tight text-white mt-1 leading-snug">
              Sign In with Campus ID Number
            </h1>
          </div>
          <div
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 transition-colors ${
              selectedRole === 'student'
                ? 'bg-[#162235] border-[#2997FF]/40 text-[#4DA8FF]'
                : 'bg-[#132826] border-[#34D399]/40 text-[#34D399]'
            }`}
          >
            <IdCard className="w-5 h-5" />
          </div>
        </div>

        {/* Role Segmented Control */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-[#CBD5E1]">
              Credential Type
            </label>
            <span className="text-xs text-[#64748B]">
              {selectedRole === 'student'
                ? 'Student Pass Access'
                : 'Organizer Console Access'}
            </span>
          </div>
          <div
            role="group"
            aria-label="Select Campus Credential Type"
            className="grid grid-cols-2 gap-1.5 p-1.5 bg-[#0C0E13] border border-[#222733] rounded-2xl"
          >
            {ROLE_OPTIONS.map((option) => {
              const isSelected = selectedRole === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleRoleSwitch(option.id)}
                  className={`min-h-[42px] py-2 px-3.5 text-xs font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#192538] text-white border border-[#38BDF8]/60 shadow-[0_4px_16px_rgba(41,151,255,0.2)]'
                      : 'text-[#94A3B8] hover:text-white border border-transparent'
                  }`}
                >
                  <span>{option.label}</span>
                  <span
                    className={`font-mono-tabular text-[11px] ${
                      isSelected ? 'text-[#4DA8FF]' : 'text-[#64748B]'
                    }`}
                  >
                    {option.prefix}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main ID Number Login Form */}
        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="campus-id-input"
                className="text-xs font-semibold text-[#E2E8F0]"
              >
                {selectedRole === 'student'
                  ? 'Student ID Number'
                  : 'Organizer ID Number'}
              </label>
              <span className="text-xs font-mono-tabular text-[#64748B]">
                Format: {ROLE_OPTIONS.find((r) => r.id === selectedRole)?.prefix}-YYYY-NNNN
              </span>
            </div>
            <div className="relative">
              <input
                ref={idInputRef}
                id="campus-id-input"
                name="campusId"
                type="text"
                autoComplete="username"
                value={campusIdInput}
                onChange={(e) => {
                  setCampusIdInput(e.target.value);
                  if (errorMessage) {
                    setErrorMessage(null);
                  }
                }}
                placeholder={
                  selectedRole === 'student'
                    ? 'STU-2026-8841 or 20268841'
                    : 'ORG-2026-0310 or 20260310'
                }
                aria-invalid={Boolean(errorMessage)}
                className={`w-full min-h-[48px] px-4 py-3 text-sm font-mono-tabular bg-[#0C0E13] text-white placeholder-[#475569] border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  errorMessage
                    ? 'border-rose-500/80 focus:ring-rose-500/40'
                    : 'border-[#252B39] hover:border-[#333B4D] focus:border-[#38BDF8] focus:ring-[#38BDF8]/25'
                }`}
              />
              {campusIdInput.trim().length > 0 && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono-tabular font-medium text-[#4DA8FF] pointer-events-none">
                  {normalizedPreview}
                </span>
              )}
            </div>

            {matchedMember && (
              <div className="mt-2 flex items-center justify-between text-xs text-[#94A3B8] px-1">
                <span>
                  Matched pass:{' '}
                  <strong className="font-semibold text-[#E2E8F0]">
                    {matchedMember.fullName}
                  </strong>
                </span>
                <span>{matchedMember.yearOrTitle}</span>
              </div>
            )}
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[48px] py-3 px-4 bg-gradient-to-r from-[#2997FF] to-[#38BDF8] hover:from-[#38A1FF] hover:to-[#52C5FA] disabled:opacity-60 active:scale-[0.99] text-[#041020] text-sm font-bold rounded-xl shadow-[0_8px_24px_rgba(41,151,255,0.28)] transition-all duration-150 flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>
              {isSubmitting ? 'Signing In...' : 'Sign In with Campus ID'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Quick Demo Directory Presets */}
      <div className="mt-6 pt-5 border-t border-[#222733]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-[#94A3B8]">
            Quick Demo Passes
          </p>
          <span className="text-xs text-[#64748B]">Click to populate</span>
        </div>
        <div className="space-y-2">
          {DEMO_CAMPUS_MEMBERS.map((member) => {
            const isCurrent =
              normalizedPreview === member.campusId &&
              selectedRole === member.role;
            return (
              <button
                key={member.campusId}
                type="button"
                onClick={() => handleSelectDemoMember(member)}
                className={`w-full min-h-[52px] text-left px-3.5 py-2.5 rounded-xl border transition-all duration-150 flex items-center justify-between gap-3 text-xs cursor-pointer ${
                  isCurrent
                    ? 'bg-[#172336] border-[#38BDF8]/70 shadow-[0_0_16px_rgba(56,189,248,0.15)]'
                    : 'bg-[#0E1117] border-[#222733] hover:border-[#333B4D] hover:bg-[#141821]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 ${
                      member.role === 'student'
                        ? 'bg-[#16243A] border-[#2997FF]/35 text-[#4DA8FF]'
                        : 'bg-[#132A28] border-[#34D399]/35 text-[#34D399]'
                    }`}
                  >
                    {member.initials}
                  </span>
                  <div className="truncate">
                    <div className="font-semibold text-white truncate">
                      {member.fullName}
                    </div>
                    <div className="text-[#94A3B8] truncate mt-0.5">
                      <span>
                        {member.role === 'student' ? 'Student' : 'Organizer'}
                      </span>
                      <span className="mx-1.5 text-[#475569]" aria-hidden="true">
                        ·
                      </span>
                      <span>{member.yearOrTitle}</span>
                    </div>
                  </div>
                </div>
                <span className="font-mono-tabular text-[#4DA8FF] font-medium shrink-0">
                  {member.campusId}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
