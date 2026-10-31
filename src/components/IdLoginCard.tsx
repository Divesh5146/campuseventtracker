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
  const [rememberStation, setRememberStation] = useState<boolean>(true);
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

  return (
    <section
      aria-label="Campus ID Sign In Portal"
      className="bg-[#16181D] border border-[#282C35] rounded-[22px] p-6 lg:p-7 flex flex-col justify-between h-full shadow-2xl text-[#E5E7EB]"
    >
      <div>
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#262A32]">
          <div>
            <p className="text-xs font-medium text-[#9CA3AF]">
              Campus Activity Platform
            </p>
            <h1 className="text-xl font-bold text-white mt-0.5">
              Sign In with Campus ID Number
            </h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#22262E] border border-[#323742] flex items-center justify-center shrink-0">
            <IdCard className="w-5 h-5 text-[#4DA8FF]" />
          </div>
        </div>

        {/* Role Segmented Control */}
        <div className="mt-5">
          <label className="block text-xs font-medium text-[#9CA3AF] mb-2">
            Credential Type
          </label>
          <div
            role="group"
            aria-label="Select Campus Credential Type"
            className="grid grid-cols-2 gap-1.5 p-1 bg-[#22262E] border border-[#2C313B] rounded-full"
          >
            {ROLE_OPTIONS.map((option) => {
              const isSelected = selectedRole === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleRoleSwitch(option.id)}
                  className={`min-h-[44px] py-2 px-3 text-xs font-semibold rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#172536] text-[#4DA8FF] border border-[#38BDF8] shadow-[0_0_14px_rgba(56,189,248,0.35)]'
                      : 'text-[#9CA3AF] hover:text-white border border-transparent'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main ID Number Login Form */}
        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="campus-id-input"
                className="text-xs font-semibold text-[#E5E7EB]"
              >
                {selectedRole === 'student' ? 'Student ID Number' : 'Organizer ID Number'}
              </label>
              <span className="text-xs font-mono-tabular text-[#8E95A2]">
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
                className={`w-full min-h-[46px] px-3.5 py-2.5 text-sm font-mono-tabular bg-[#1E222A] text-white placeholder-[#6B7280] border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  errorMessage
                    ? 'border-rose-500/80 focus:ring-rose-500/50'
                    : 'border-[#323742] focus:border-[#38BDF8] focus:ring-[#38BDF8]/30'
                }`}
              />
              {campusIdInput.trim().length > 0 && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono-tabular text-[#4DA8FF] pointer-events-none">
                  {normalizedPreview}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <label className="min-h-[40px] inline-flex items-center gap-2 text-xs text-[#9CA3AF] cursor-pointer">
              <input
                type="checkbox"
                checked={rememberStation}
                onChange={(e) => setRememberStation(e.target.checked)}
                className="w-4 h-4 rounded border-[#383E4C] bg-[#1E222A] text-[#2997FF] focus:ring-[#38BDF8]"
              />
              <span>Keep Campus ID active on this kiosk</span>
            </label>
            <button
              type="button"
              onClick={() => {
                const defaultDemo =
                  DEMO_CAMPUS_MEMBERS.find((m) => m.role === selectedRole) ||
                  DEMO_CAMPUS_MEMBERS[0];
                handleSelectDemoMember(defaultDemo);
              }}
              className="min-h-[40px] px-1 text-xs font-semibold text-[#4DA8FF] hover:text-[#7CC2FF] underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Fill Sample ID
            </button>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[48px] py-3 px-4 bg-[#2997FF] hover:bg-[#47A8FF] disabled:opacity-60 active:scale-[0.99] text-[#051224] text-sm font-bold rounded-xl shadow-[0_0_20px_rgba(41,151,255,0.3)] transition-all flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>
              {isSubmitting ? 'Signing In...' : 'Sign In with Campus ID'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Quick Demo Directory Presets */}
      <div className="mt-6 pt-4 border-t border-[#262A32]">
        <p className="text-xs font-semibold text-[#9CA3AF] mb-2.5">
          Instant Directory Test Credentials (Click to Populate)
        </p>
        <div className="space-y-2">
          {DEMO_CAMPUS_MEMBERS.map((member) => (
            <button
              key={member.campusId}
              type="button"
              onClick={() => handleSelectDemoMember(member)}
              className="w-full min-h-[48px] text-left px-3.5 py-2.5 rounded-xl bg-[#1E222A] border border-[#2E333E] hover:border-[#38BDF8]/60 hover:bg-[#232832] active:scale-[0.99] transition-all flex items-center justify-between gap-2 text-xs cursor-pointer"
            >
              <div className="truncate">
                <span className="font-semibold text-white">{member.fullName}</span>
                <span className="text-[#6B7280] mx-1.5" aria-hidden="true">
                  ·
                </span>
                <span className="text-[#9CA3AF]">{member.department}</span>
              </div>
              <span className="font-mono-tabular text-[#4DA8FF] font-medium shrink-0">
                {member.campusId}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
