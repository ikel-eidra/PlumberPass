type UiIconName =
  | "arrowLeft"
  | "arrowRight"
  | "book"
  | "brain"
  | "chart"
  | "chat"
  | "flame"
  | "hearing"
  | "home"
  | "image"
  | "imageSearch"
  | "mic"
  | "pipe"
  | "playCircle"
  | "search"
  | "settings"
  | "speaker"
  | "timer"
  | "visibility"
  | "voice"
  | "warning"
  | "waveform";

type UiIconProps = {
  name: UiIconName;
  size?: number;
  className?: string;
  title?: string;
};

const iconMap: Record<UiIconName, JSX.Element> = {
  arrowLeft: (
    <>
      <path d="M15 6l-6 6 6 6" />
      <path d="M9 12h10" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M9 6l6 6-6 6" />
      <path d="M15 12H5" />
    </>
  ),
  book: (
    <>
      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4H19v15H7.5A2.5 2.5 0 0 0 5 21z" />
      <path d="M5 6v15" />
      <path d="M8.5 8.5H16" />
      <path d="M8.5 12H16" />
    </>
  ),
  brain: (
    <>
      <path d="M9 7.5a2.5 2.5 0 0 1 5 0v9a2.5 2.5 0 0 1-5 0z" />
      <path d="M9 10a2.5 2.5 0 1 1-3.5 3.5" />
      <path d="M15 10a2.5 2.5 0 1 0 3.5 3.5" />
      <path d="M8.5 14a2.5 2.5 0 0 1-3 2.2" />
      <path d="M15.5 14a2.5 2.5 0 0 0 3 2.2" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19h16" />
      <path d="M6 16l4-4 3 2 5-6" />
      <path d="M18 8h-3" />
      <path d="M18 8v3" />
    </>
  ),
  chat: (
    <>
      <path d="M5 7.5A2.5 2.5 0 0 1 7.5 5h9A2.5 2.5 0 0 1 19 7.5v6A2.5 2.5 0 0 1 16.5 16H11l-4 3v-3H7.5A2.5 2.5 0 0 1 5 13.5z" />
    </>
  ),
  flame: (
    <>
      <path d="M12 3c1.7 2.2 3.5 4.1 3.5 7A3.5 3.5 0 1 1 8.5 10c0-1.6.8-3.3 2.2-5.1.6 1.1 1.3 1.8 1.3 1.8S12.2 5 12 3z" />
      <path d="M12 12.5c.9 1 1.5 1.9 1.5 3a1.5 1.5 0 0 1-3 0c0-.8.4-1.6 1.1-2.5.2.4.4.6.4.6s.1-.4 0-1.1z" />
    </>
  ),
  hearing: (
    <>
      <path d="M14.5 17.5a2.5 2.5 0 0 1-5 0c0-1.7 1.1-2.5 2.2-3.4 1-.8 1.8-1.5 1.8-3.1a2.5 2.5 0 1 0-5 0" />
      <path d="M6.5 9.5a4.5 4.5 0 1 1 8.9 1" />
      <path d="M17.5 9.5a6.5 6.5 0 1 0-11.5 4.1" />
    </>
  ),
  home: (
    <>
      <path d="M4 11.5L12 5l8 6.5" />
      <path d="M6.5 10.5V19h11v-8.5" />
    </>
  ),
  image: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2.5" />
      <path d="M8 14l2.5-2.5L13 14l2.5-2.5L18 14" />
      <circle cx="9" cy="9" r="1.25" />
    </>
  ),
  imageSearch: (
    <>
      <rect x="4" y="5" width="12" height="11" rx="2.5" />
      <path d="M7 13l2-2 2.2 2.2 2.1-2.2L16 13.8" />
      <circle cx="17.5" cy="16.5" r="2.5" />
      <path d="M19.3 18.3L21 20" />
    </>
  ),
  mic: (
    <>
      <path d="M12 15a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z" />
      <path d="M18.5 11a6.5 6.5 0 0 1-13 0" />
      <path d="M12 17.5V21" />
      <path d="M8.5 21h7" />
    </>
  ),
  pipe: (
    <>
      <path d="M7 4v5a3 3 0 0 0 3 3h4" />
      <path d="M14 7V4" />
      <path d="M17 20v-5a3 3 0 0 0-3-3h-1" />
      <path d="M17 20h3" />
      <path d="M4 4h3" />
    </>
  ),
  playCircle: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="5.5" />
      <path d="M16 16l4 4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="2.5" />
      <path d="M19 12a1 1 0 0 0 .7 1l.2.1a1 1 0 0 1 .3 1.5l-.2.3a1 1 0 0 1-1.4.3l-.2-.1a1 1 0 0 0-1.2.2l-.1.2a1 1 0 0 0-.1 1v.3a1 1 0 0 1-1 1h-.4a1 1 0 0 1-1-1v-.3a1 1 0 0 0-.6-.9l-.2-.1a1 1 0 0 0-1 .1l-.2.1a1 1 0 0 1-1.4-.3l-.2-.3a1 1 0 0 1 .3-1.5l.2-.1a1 1 0 0 0 .4-1.2l-.1-.2a1 1 0 0 0-.9-.6h-.3a1 1 0 0 1-1-1v-.4a1 1 0 0 1 1-1h.3a1 1 0 0 0 .9-.6l.1-.2a1 1 0 0 0-.4-1.2l-.2-.1a1 1 0 0 1-.3-1.5l.2-.3a1 1 0 0 1 1.4-.3l.2.1a1 1 0 0 0 1-.1l.2-.1a1 1 0 0 0 .6-.9v-.3a1 1 0 0 1 1-1h.4a1 1 0 0 1 1 1v.3a1 1 0 0 0 .6.9l.2.1a1 1 0 0 0 1-.1l.2-.1a1 1 0 0 1 1.4.3l.2.3a1 1 0 0 1-.3 1.5l-.2.1a1 1 0 0 0-.4 1.2l.1.2a1 1 0 0 0 .9.6H18a1 1 0 0 1 1 1z" />
    </>
  ),
  speaker: (
    <>
      <path d="M5 14h3l4 3V7L8 10H5z" />
      <path d="M16 9.5a4.5 4.5 0 0 1 0 5" />
      <path d="M18.5 7a8 8 0 0 1 0 10" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="7" />
      <path d="M12 13V9.5" />
      <path d="M12 13l3 2" />
      <path d="M9 3h6" />
    </>
  ),
  visibility: (
    <>
      <path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  voice: (
    <>
      <circle cx="9" cy="10" r="2.5" />
      <path d="M5.5 18a4.5 4.5 0 0 1 7 0" />
      <path d="M16 9.5a4.5 4.5 0 0 1 0 5" />
      <path d="M18.5 7.5a7.5 7.5 0 0 1 0 9" />
    </>
  ),
  warning: (
    <>
      <path d="M12 4l8 14H4z" />
      <path d="M12 9v4" />
      <circle cx="12" cy="16.5" r=".75" fill="currentColor" stroke="none" />
    </>
  ),
  waveform: (
    <>
      <path d="M5 14V10" />
      <path d="M8 16V8" />
      <path d="M11 19V5" />
      <path d="M14 16V8" />
      <path d="M17 14V10" />
      <path d="M20 12v0" />
    </>
  ),
};

export default function UiIcon({ name, size = 20, className, title }: UiIconProps) {
  return (
    <svg
      className={["ui-icon", className].filter(Boolean).join(" ")}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : "true"}
      role={title ? "img" : "presentation"}
    >
      {title ? <title>{title}</title> : null}
      {iconMap[name]}
    </svg>
  );
}
