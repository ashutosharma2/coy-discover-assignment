export type Tab = "home" | "discover";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" />
    </svg>
  );
}

function LetterIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18v12H3z" />
      <path d="m3 7 9 7 9-7" />
    </svg>
  );
}

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="tabbar" aria-label="Main">
      <button
        type="button"
        className="tabbar-item"
        aria-current={tab === "home" ? "page" : undefined}
        onClick={() => onChange("home")}
      >
        <HomeIcon />
        Home
      </button>
      <button
        type="button"
        className="tabbar-item"
        aria-current={tab === "discover" ? "page" : undefined}
        onClick={() => onChange("discover")}
      >
        <LetterIcon />
        Discover
      </button>
    </nav>
  );
}
