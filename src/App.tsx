/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  CampusActivity,
  CampusAnnouncement,
  CampusMember,
  CampusRole,
} from './data/campusData';
import { BroadcastInput } from './utils/campusAuth';
import { apiClient } from './utils/apiClient';
import { IdLoginCard } from './components/IdLoginCard';
import { CampusEventDashboard } from './components/CampusEventDashboard';

export default function App() {
  const [activeMember, setActiveMember] = useState<CampusMember | null>(null);
  const [announcements, setAnnouncements] = useState<CampusAnnouncement[]>([]);
  const [activities, setActivities] = useState<CampusActivity[]>([]);
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const idInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialDashboard() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams(window.location.search);
        const roleParam =
          params.get('role') ||
          (params.get('autostart') === '1' ? 'student' : undefined);

        const data = await apiClient.getDashboardData({ role: roleParam });
        if (!isMounted) return;

        setActivities(data.activities);
        setAnnouncements(data.announcements);
        setRegisteredIds(data.registeredIds);
        if (data.activeMember) {
          setActiveMember(data.activeMember);
        }
      } catch (err) {
        console.error('Failed to load initial dashboard data:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (
    campusId: string,
    role: CampusRole
  ): Promise<{ valid: boolean; error?: string }> => {
    const loginRes = await apiClient.login(campusId, role);
    if (!loginRes.valid || !loginRes.member) {
      return {
        valid: false,
        error: loginRes.error || 'Unable to verify Campus ID credentials.',
      };
    }

    const dashboardData = await apiClient.getDashboardData({
      campusId: loginRes.member.campusId,
    });

    setActiveMember(loginRes.member);
    setActivities(dashboardData.activities);
    setAnnouncements(dashboardData.announcements);
    setRegisteredIds(
      loginRes.registeredIds || dashboardData.registeredIds || []
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return { valid: true };
  };

  const handleLoginSuccess = (member: CampusMember) => {
    void handleLogin(member.campusId, member.role);
  };

  const handleLogout = () => {
    setActiveMember(null);
    setRegisteredIds([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleReservation = async (activityId: string) => {
    if (!activeMember) return;
    try {
      const result = await apiClient.toggleReservation(
        activityId,
        activeMember.campusId
      );
      setActivities(result.activities);
      setRegisteredIds(result.registeredIds);
    } catch (err) {
      console.error('Failed to toggle activity reservation:', err);
    }
  };

  const handleBroadcastAnnouncement = async (
    input: BroadcastInput
  ): Promise<{ valid: boolean; error?: string }> => {
    if (!activeMember) {
      return { valid: false, error: 'You must be signed in as an Organizer.' };
    }

    try {
      const result = await apiClient.broadcastAnnouncement(input, {
        fullName: activeMember.fullName,
        campusId: activeMember.campusId,
      });

      if (!result.valid) {
        return {
          valid: false,
          error: result.error || 'Please enter a message to broadcast.',
        };
      }

      setAnnouncements(result.announcements);
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Unable to reach announcement server.',
      };
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0D0F12] text-[#E5E7EB] p-4">
        <div className="bg-[#16181D] border border-[#282C35] rounded-[22px] px-6 py-5 shadow-2xl flex items-center gap-3.5">
          <span className="w-3 h-3 rounded-full bg-[#2997FF] animate-pulse" />
          <span className="text-sm font-medium text-[#D1D5DB]">
            Loading Campus Activity Platform...
          </span>
        </div>
      </main>
    );
  }

  if (!activeMember) {
    return (
      <main className="relative min-h-screen flex items-center justify-center bg-[#090B0E] text-[#E5E7EB] p-4 sm:p-6 overflow-hidden selection:bg-[#2997FF]/30 selection:text-white">
        {/* Ambient architectural radial lighting */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 overflow-hidden"
        >
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[680px] h-[420px] rounded-full bg-[#2997FF]/12 blur-[130px]" />
          <div className="absolute -bottom-40 left-1/3 w-[520px] h-[360px] rounded-full bg-indigo-500/8 blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>

        <div className="relative z-10 w-full max-w-[460px]">
          <IdLoginCard
            activeMember={null}
            onLoginSuccess={handleLoginSuccess}
            onLogin={handleLogin}
            onLogout={handleLogout}
            registeredCount={0}
            verifiedHours={0}
            onVerifyCheckIn={() => ({ success: false, message: '' })}
            idInputRef={idInputRef}
          />
        </div>
      </main>
    );
  }

  return (
    <CampusEventDashboard
      member={activeMember}
      canBroadcast={activeMember.role === 'organization'}
      announcements={announcements}
      activities={activities}
      registeredIds={registeredIds}
      onUpdateAnnouncements={setAnnouncements}
      onBroadcastAnnouncement={handleBroadcastAnnouncement}
      onToggleReservation={handleToggleReservation}
      onLogout={handleLogout}
    />
  );
}
