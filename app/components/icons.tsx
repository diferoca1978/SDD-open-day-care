type IconProps = { size?: number; className?: string };

function Icon({ children, size = 20, className }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

const stroke = { stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 2 };
const strokeBold = { ...stroke, strokeWidth: 2.2 };

export function SunIcon({ size, className }: IconProps) {
  return <Icon size={size} className={className}><circle cx="12" cy="12" r="4" {...stroke} /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" {...stroke} /></Icon>;
}

export function HomeIcon({ size, className }: IconProps) {
  return <Icon size={size} className={className}><path d="m3 9.5 9-6.5 9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" {...stroke} /></Icon>;
}

export function PeopleIcon({ size, className }: IconProps) {
  return <Icon size={size} className={className}><circle cx="9" cy="7" r="3" {...stroke} /><circle cx="17" cy="9" r="2.4" {...stroke} /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 20a5 5 0 0 1 5.5-4.9" {...stroke} /></Icon>;
}

export function BellIcon({ size, className }: IconProps) {
  return <Icon size={size} className={className}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" {...stroke} /></Icon>;
}

export function UserIcon({ size, className }: IconProps) {
  return <Icon size={size} className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" {...stroke} /><circle cx="12" cy="7" r="4" {...stroke} /></Icon>;
}

export function PlusIcon({ size, className }: IconProps) {
  return <Icon size={size} className={className}><path d="M12 5v14M5 12h14" {...stroke} /></Icon>;
}

export function CameraIcon({ size, className }: IconProps) {
  return <Icon size={size} className={className}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" {...stroke} /><circle cx="12" cy="13" r="4" {...stroke} /></Icon>;
}

export function HeartIcon({ size, className, filled = false }: IconProps & { filled?: boolean }) {
  return <Icon size={size} className={className}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" fill={filled ? "currentColor" : "none"} {...stroke} /></Icon>;
}

export function CommentIcon({ size, className }: IconProps) {
  return <Icon size={size} className={className}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" {...stroke} /></Icon>;
}

export function MegaphoneIcon({ size, className }: IconProps) {
  return <Icon size={size} className={className}><path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" {...stroke} /></Icon>;
}

export function ImageIcon({ size, className }: IconProps) {
  return <Icon size={size} className={className}><rect x="3" y="3" width="18" height="18" rx="2" {...stroke} /><circle cx="9" cy="9" r="2" {...stroke} /><path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" {...stroke} /></Icon>;
}

export function LogoutIcon({ size, className }: IconProps) {
  return <Icon size={size} className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" {...stroke} /></Icon>;
}

export function SearchIcon({ size, className }: IconProps) {
  return <Icon size={size} className={className}><circle cx="11" cy="11" r="7" {...stroke} /><path d="m21 21-4.3-4.3" {...stroke} /></Icon>;
}

export function ChevronLeftIcon({ size, className }: IconProps) {
  return <Icon size={size} className={className}><path d="m15 18-6-6 6-6" {...strokeBold} /></Icon>;
}

export function ChevronRightIcon({ size, className }: IconProps) {
  return <Icon size={size} className={className}><path d="m9 18 6-6-6-6" {...strokeBold} /></Icon>;
}

export function AlertIcon({ size, className }: IconProps) {
  return <Icon size={size} className={className}><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" {...strokeBold} /><path d="M12 9v4M12 17h.01" {...strokeBold} /></Icon>;
}
