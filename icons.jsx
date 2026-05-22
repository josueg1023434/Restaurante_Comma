// Simple stroke icons — Lucide-style. Each icon is a full SVG component.
const SVG = ({ size = 16, stroke = 1.6, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth={stroke}
       strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const Icons = {
  Overview: (p) => <SVG {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </SVG>,
  Calendar: (p) => <SVG {...p}>
    <rect x="3" y="4" width="18" height="17" rx="2" />
    <path d="M3 9h18M8 2v4M16 2v4" />
  </SVG>,
  Tasks: (p) => <SVG {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M8 12l2.5 2.5L16 9" />
  </SVG>,
  Payroll: (p) => <SVG {...p}>
    <rect x="2" y="6" width="20" height="13" rx="2" />
    <circle cx="12" cy="12.5" r="2.5" />
    <path d="M6 10v5M18 10v5" />
  </SVG>,
  Staff: (p) => <SVG {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M21 19c0-2.5-1.7-4-4-4" />
  </SVG>,
  Reports: (p) => <SVG {...p}>
    <path d="M4 19V5M4 19h16" />
    <rect x="7" y="11" width="3" height="8" />
    <rect x="12" y="7" width="3" height="12" />
    <rect x="17" y="14" width="3" height="5" />
  </SVG>,
  Inventory: (p) => <SVG {...p}>
    <path d="M3 7l9-4 9 4-9 4-9-4z" />
    <path d="M3 7v10l9 4 9-4V7" />
    <path d="M12 11v10" />
  </SVG>,
  Settings: (p) => <SVG {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.8L4.3 7a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </SVG>,
  Search: (p) => <SVG {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </SVG>,
  Bell: (p) => <SVG {...p}>
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </SVG>,
  Plus: (p) => <SVG {...p}><path d="M12 5v14M5 12h14" /></SVG>,
  Download: (p) => <SVG {...p}>
    <path d="M12 3v13M6 11l6 6 6-6" />
    <path d="M5 21h14" />
  </SVG>,
  Filter: (p) => <SVG {...p}><path d="M3 5h18l-7 9v6l-4-2v-4z" /></SVG>,
  Phone: (p) => <SVG {...p}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z" />
  </SVG>,
  MoreH: (p) => <SVG {...p}>
    <circle cx="5" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
  </SVG>,
  ChevronDown: (p) => <SVG {...p}><path d="M6 9l6 6 6-6" /></SVG>,
  ChevronLeft: (p) => <SVG {...p}><path d="M15 18l-6-6 6-6" /></SVG>,
  ChevronRight: (p) => <SVG {...p}><path d="M9 6l6 6-6 6" /></SVG>,
  Clock: (p) => <SVG {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </SVG>,
  Check: (p) => <SVG {...p}><path d="M5 12l5 5L20 7" /></SVG>,
  ArrowUp: (p) => <SVG {...p}><path d="M12 19V5M5 12l7-7 7 7" /></SVG>,
  ArrowDown: (p) => <SVG {...p}><path d="M12 5v14M5 12l7 7 7-7" /></SVG>,
  Coffee: (p) => <SVG {...p}>
    <path d="M3 8h14v6a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8z" />
    <path d="M17 11h2a2.5 2.5 0 0 1 0 5h-2" />
    <path d="M7 2v3M11 2v3M15 2v3" />
  </SVG>,
};

window.Icons = Icons;
