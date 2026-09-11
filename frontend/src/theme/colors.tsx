import React from 'react';

// Enterprise Platform Color Tokens (Strictly Zero Blue, Zero Violet, Zero Purple, Zero Indigo)
export const PLATFORM_COLORS = {
  // Primary: High-Tech Industrial Amber / Gold
  amberPrimary: '#D97706',
  amberHover: '#B45309',
  amberSubtle: 'rgba(217, 119, 6, 0.12)',

  // Secondary: Cyber Emerald / Jade
  emerald: '#059669',
  emeraldHover: '#047857',
  emeraldSubtle: 'rgba(5, 150, 105, 0.12)',

  // Status Colors
  danger: '#DC2626',
  warning: '#D97706',
  success: '#059669',

  // Dark Canvas (Obsidian & Titanium)
  canvasDark: '#0A0C0E',
  surfaceDark: '#14181C',
  surfaceDarkHover: '#1C2127',
  borderDark: '#222830',
  borderDarkHighlight: '#323A46',
  textDark: '#F3F4F6',
  textDarkMuted: '#9CA3AF',
  textDarkSubtle: '#6B7280',

  // Light Canvas (Clean Titanium Slate)
  canvasLight: '#F8F9FA',
  surfaceLight: '#FFFFFF',
  surfaceLightHover: '#F3F4F6',
  borderLight: '#E5E7EB',
  borderLightHighlight: '#D1D5DB',
  textLight: '#111827',
  textLightMuted: '#4B5563',
  textLightSubtle: '#9CA3AF',
};

// Aliases for compatibility
export const CLAUDE_COLORS = PLATFORM_COLORS;

// Document Category Badges (Strictly Emerald, Amber, Earth, Charcoal)
export const CATEGORY_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  Contract: { bg: 'bg-[#D97706]/10', text: 'text-[#D97706]', border: 'border-[#D97706]/30' },
  Financial: { bg: 'bg-[#059669]/10', text: 'text-[#059669]', border: 'border-[#059669]/30' },
  Invoice: { bg: 'bg-[#D97706]/15', text: 'text-[#B45309]', border: 'border-[#D97706]/40' },
  Policy: { bg: 'bg-[#4B5563]/10', text: 'text-[var(--app-text)]', border: 'border-[#4B5563]/30' },
  Technical: { bg: 'bg-[#059669]/15', text: 'text-[#047857]', border: 'border-[#059669]/40' },
  HR: { bg: 'bg-[#78350F]/10', text: 'text-[#92400E]', border: 'border-[#78350F]/30' },
};

// Custom Enterprise Platform Logo Icon (DocMind Nexus Hex Matrix Core)
export const NexusIcon: React.FC<{ className?: string; size?: number }> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" fillOpacity="0.25" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

// Compatibility alias for previous ClaudeSpark imports
export const ClaudeSpark = NexusIcon;
