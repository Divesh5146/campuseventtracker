import React from 'react';
import { CampusActivity } from '../data/campusData';

export const CampusQuadArtwork: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-slate-900 border border-slate-800 ${className}`}
      role="img"
      aria-label="Architectural illustration of Alderbrook North Quad and Student Activity Pavilion at golden hour"
    >
      <svg
        viewBox="0 0 800 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-cover"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="420" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="55%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="sunGlow" x1="620" y1="60" x2="400" y2="380" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.28" />
            <stop offset="60%" stopColor="#D97706" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="glassWarm" x1="0" y1="140" x2="0" y2="310" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        {/* Sky & Warm Golden Hour Atmosphere */}
        <rect width="800" height="420" fill="url(#skyGrad)" />
        <circle cx="640" cy="92" r="180" fill="url(#sunGlow)" />
        <circle cx="640" cy="92" r="28" fill="#FDE68A" fillOpacity="0.22" />

        {/* Architectural Grid Lines */}
        <g stroke="#475569" strokeOpacity="0.25" strokeWidth="1">
          <line x1="0" y1="80" x2="800" y2="80" />
          <line x1="0" y1="160" x2="800" y2="160" />
          <line x1="0" y1="240" x2="800" y2="240" />
          <line x1="160" y1="0" x2="160" y2="420" />
          <line x1="360" y1="0" x2="360" y2="420" />
          <line x1="560" y1="0" x2="560" y2="420" />
        </g>

        {/* Distant Observatory & Bell Tower Silhouette */}
        <path
          d="M90 310V150L125 112L160 150V310H90Z"
          fill="#1E293B"
          stroke="#475569"
          strokeWidth="1.5"
        />
        <rect x="116" y="158" width="18" height="36" rx="9" fill="#FDE68A" fillOpacity="0.35" />
        <path
          d="M650 310V190C650 162 672 140 700 140C728 140 750 162 750 190V310H650Z"
          fill="#1E293B"
          stroke="#475569"
          strokeWidth="1.5"
        />

        {/* Main Limestone & Timber Student Commons Pavilion */}
        <rect
          x="195"
          y="148"
          width="425"
          height="162"
          fill="#0F172A"
          stroke="#94A3B8"
          strokeWidth="1.5"
        />
        {/* Cantilevered Roof Slab */}
        <path d="M170 148H648L632 132H186L170 148Z" fill="#CBD5E1" />
        <rect x="180" y="148" width="456" height="6" fill="#D97706" />

        {/* Illuminated Glazed Curtain Wall Bays */}
        <g>
          <rect x="215" y="166" width="84" height="128" fill="url(#glassWarm)" stroke="#64748B" />
          <rect x="313" y="166" width="84" height="128" fill="url(#glassWarm)" stroke="#64748B" />
          <rect x="411" y="166" width="84" height="128" fill="url(#glassWarm)" stroke="#64748B" />
          <rect x="509" y="166" width="88" height="128" fill="url(#glassWarm)" stroke="#64748B" />
        </g>

        {/* Interior Mezzanine Truss & Hanging Acoustic Lamps */}
        <line x1="215" y1="218" x2="597" y2="218" stroke="#94A3B8" strokeWidth="2" />
        <circle cx="257" cy="192" r="5" fill="#FDE68A" />
        <circle cx="355" cy="192" r="5" fill="#FDE68A" />
        <circle cx="453" cy="192" r="5" fill="#FDE68A" />
        <circle cx="553" cy="192" r="5" fill="#FDE68A" />

        {/* Limestone Quad Steps & Plaza Foreground */}
        <path d="M0 310H800V420H0V310Z" fill="#1E293B" />
        <path d="M120 310L60 420H740L680 310H120Z" fill="#0F172A" fillOpacity="0.55" />
        <line x1="150" y1="332" x2="650" y2="332" stroke="#475569" strokeWidth="1.5" />
        <line x1="125" y1="358" x2="675" y2="358" stroke="#475569" strokeWidth="1.5" />
        <line x1="95" y1="388" x2="705" y2="388" stroke="#475569" strokeWidth="1.5" />

        {/* Architectural Scale Figures & Activity Kiosks */}
        <g fill="#F8FAFC">
          <circle cx="285" cy="322" r="4.5" />
          <rect x="281" y="328" width="8" height="18" rx="3" />
          <circle cx="302" cy="324" r="4" />
          <rect x="298" y="330" width="8" height="16" rx="3" fill="#F59E0B" />

          <circle cx="468" cy="336" r="4.5" />
          <rect x="464" y="342" width="8" height="18" rx="3" />
          <circle cx="486" cy="335" r="4.5" />
          <rect x="482" y="341" width="8" height="19" rx="3" fill="#38BDF8" />
        </g>
      </svg>

      {/* Measured Scrim & Architectural Caption Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/25 to-transparent flex flex-col justify-end p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs text-slate-200">
          <span className="font-medium truncate">
            Alderbrook Student Union & North Quad Pavilion
          </span>
          <span className="font-mono-tabular text-amber-300 shrink-0">
            Autumn Term 2026 · Week 09
          </span>
        </div>
      </div>
    </div>
  );
};

export const ActivityArtwork: React.FC<{
  type: CampusActivity['illustrationType'];
  category: string;
}> = ({ type, category }) => {
  return (
    <div
      className="relative h-40 w-full overflow-hidden bg-slate-900 border-b border-slate-200"
      role="img"
      aria-label={`${category} illustration`}
    >
      {type === 'robotics' && (
        <svg viewBox="0 0 400 180" fill="none" className="w-full h-full object-cover">
          <rect width="400" height="180" fill="#0F172A" />
          <g stroke="#1E293B" strokeWidth="1">
            <line x1="0" y1="45" x2="400" y2="45" />
            <line x1="0" y1="90" x2="400" y2="90" />
            <line x1="0" y1="135" x2="400" y2="135" />
            <line x1="100" y1="0" x2="100" y2="180" />
            <line x1="200" y1="0" x2="200" y2="180" />
            <line x1="300" y1="0" x2="300" y2="180" />
          </g>
          {/* LiDAR Scan Rings */}
          <circle cx="200" cy="95" r="72" stroke="#38BDF8" strokeOpacity="0.22" strokeDasharray="4 4" />
          <circle cx="200" cy="95" r="46" stroke="#38BDF8" strokeOpacity="0.4" strokeDasharray="3 3" />
          {/* Quadruped Chassis */}
          <rect x="155" y="76" width="90" height="26" rx="5" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.75" />
          <rect x="190" y="62" width="22" height="14" rx="3" fill="#F59E0B" />
          <path d="M168 102L152 128L162 146" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
          <path d="M188 102L180 130L188 146" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
          <path d="M214 102L222 130L214 146" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
          <path d="M234 102L248 128L238 146" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
          <line x1="90" y1="148" x2="310" y2="148" stroke="#475569" strokeWidth="2" />
        </svg>
      )}

      {type === 'symphony' && (
        <svg viewBox="0 0 400 180" fill="none" className="w-full h-full object-cover">
          <rect width="400" height="180" fill="#1C1917" />
          {/* Cedar Acoustic Slats */}
          <g stroke="#78350F" strokeOpacity="0.45" strokeWidth="4">
            <line x1="40" y1="0" x2="40" y2="180" />
            <line x1="80" y1="0" x2="80" y2="180" />
            <line x1="120" y1="0" x2="120" y2="180" />
            <line x1="160" y1="0" x2="160" y2="180" />
            <line x1="240" y1="0" x2="240" y2="180" />
            <line x1="280" y1="0" x2="280" y2="180" />
            <line x1="320" y1="0" x2="320" y2="180" />
            <line x1="360" y1="0" x2="360" y2="180" />
          </g>
          {/* Acoustic Harmonic Waves & Stage */}
          <circle cx="200" cy="96" r="56" fill="#F59E0B" fillOpacity="0.14" />
          <path
            d="M70 110C120 65 160 140 200 92C240 44 280 130 330 85"
            stroke="#FBBF24"
            strokeWidth="2"
          />
          <path
            d="M70 124C120 85 160 150 200 106C240 62 280 140 330 100"
            stroke="#FDE68A"
            strokeOpacity="0.55"
            strokeWidth="1.5"
          />
          <circle cx="200" cy="92" r="6" fill="#FDE68A" />
        </svg>
      )}

      {type === 'conservatory' && (
        <svg viewBox="0 0 400 180" fill="none" className="w-full h-full object-cover">
          <rect width="400" height="180" fill="#06281E" />
          {/* Glass Conservatory Arches */}
          <path
            d="M60 165V85C60 46 122 22 200 22C278 22 340 46 340 85V165"
            stroke="#34D399"
            strokeOpacity="0.4"
            strokeWidth="1.5"
          />
          <path
            d="M110 165V92C110 62 150 42 200 42C250 42 290 62 290 92V165"
            stroke="#6EE7B7"
            strokeOpacity="0.3"
            strokeWidth="1.5"
          />
          {/* Hydroponic Vertical Towers */}
          <line x1="155" y1="54" x2="155" y2="155" stroke="#A7F3D0" strokeWidth="2.5" />
          <line x1="200" y1="44" x2="200" y2="155" stroke="#A7F3D0" strokeWidth="2.5" />
          <line x1="245" y1="54" x2="245" y2="155" stroke="#A7F3D0" strokeWidth="2.5" />
          <circle cx="155" cy="82" r="8" fill="#10B981" />
          <circle cx="200" cy="74" r="9" fill="#34D399" />
          <circle cx="245" cy="82" r="8" fill="#10B981" />
          <circle cx="155" cy="114" r="8" fill="#059669" />
          <circle cx="200" cy="108" r="9" fill="#10B981" />
          <circle cx="245" cy="114" r="8" fill="#059669" />
        </svg>
      )}

      {type === 'debate' && (
        <svg viewBox="0 0 400 180" fill="none" className="w-full h-full object-cover">
          <rect width="400" height="180" fill="#1E1B4B" />
          {/* Rotunda Concentric Seating */}
          <path d="M80 155A120 90 0 0 1 320 155" stroke="#818CF8" strokeOpacity="0.4" strokeWidth="2" />
          <path d="M110 155A90 68 0 0 1 290 155" stroke="#A5B4FC" strokeOpacity="0.55" strokeWidth="2" />
          <path d="M140 155A60 45 0 0 1 260 155" stroke="#C7D2FE" strokeOpacity="0.75" strokeWidth="2" />
          <rect x="184" y="106" width="32" height="38" rx="3" fill="#312E81" stroke="#E0E7FF" strokeWidth="1.5" />
          <circle cx="200" cy="88" r="9" fill="#FDE68A" />
        </svg>
      )}

      {type === 'rowing' && (
        <svg viewBox="0 0 400 180" fill="none" className="w-full h-full object-cover">
          <rect width="400" height="180" fill="#0C2D48" />
          {/* Water Ripples & Racing Shell */}
          <path d="M0 125Q100 115 200 125T400 125" stroke="#38BDF8" strokeOpacity="0.35" strokeWidth="1.5" />
          <path d="M0 145Q100 135 200 145T400 145" stroke="#38BDF8" strokeOpacity="0.25" strokeWidth="1.5" />
          <path d="M55 92L200 84L345 92L200 100L55 92Z" fill="#F8FAFC" />
          <line x1="130" y1="90" x2="105" y2="52" stroke="#F59E0B" strokeWidth="2" />
          <line x1="175" y1="90" x2="150" y2="52" stroke="#F59E0B" strokeWidth="2" />
          <line x1="225" y1="94" x2="250" y2="132" stroke="#F59E0B" strokeWidth="2" />
          <line x1="270" y1="94" x2="295" y2="132" stroke="#F59E0B" strokeWidth="2" />
        </svg>
      )}

      {type === 'astronomy' && (
        <svg viewBox="0 0 400 180" fill="none" className="w-full h-full object-cover">
          <rect width="400" height="180" fill="#090D16" />
          <circle cx="90" cy="42" r="1.5" fill="#F8FAFC" />
          <circle cx="145" cy="28" r="2" fill="#FDE68A" />
          <circle cx="290" cy="36" r="1.5" fill="#F8FAFC" />
          <circle cx="330" cy="68" r="2" fill="#38BDF8" />
          {/* Transit Light Curve */}
          <path
            d="M45 64H135L158 112H242L265 64H355"
            stroke="#38BDF8"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="200" cy="112" r="5" fill="#F59E0B" />
          <line x1="45" y1="142" x2="355" y2="142" stroke="#334155" strokeDasharray="3 3" />
        </svg>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent flex items-end p-4">
        <span className="text-xs font-medium text-slate-200 tracking-wide">
          {category}
        </span>
      </div>
    </div>
  );
};

export const CampusBarcodeSvg: React.FC<{ code: string }> = ({ code }) => {
  // Expand code token so barcode spans the full 280px credential width cleanly
  const expanded = `${code}-ALDERBROOK-${code}`;
  const bars = Array.from(expanded).flatMap((ch, idx) => {
    const val = ch.charCodeAt(0) + idx * 5;
    return [
      (val % 3) + 1.2,
      ((val >> 1) % 2) + 1,
    ];
  });

  let currentX = 4;
  return (
    <svg
      viewBox="0 0 280 34"
      preserveAspectRatio="none"
      className="w-full h-8 text-slate-900"
      role="img"
      aria-label={`Digital barcode for Campus ID ${code}`}
    >
      {bars.map((width, index) => {
        const x = currentX;
        currentX += width + 2.1;
        if (x > 274) return null;
        return (
          <rect
            key={index}
            x={x}
            y={2}
            width={width}
            height={30}
            fill="currentColor"
            rx={0.4}
          />
        );
      })}
    </svg>
  );
};
