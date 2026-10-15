export function FloralCorner({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 180 180"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M12 168C28 120 58 92 98 78C78 108 86 138 118 158"
        stroke="#C6A46A"
        strokeWidth="1.2"
      />
      <path
        d="M22 148C48 118 82 102 122 96"
        stroke="#B85C6E"
        strokeWidth="1"
        opacity="0.7"
      />
      <circle cx="118" cy="78" r="10" fill="#F3D6D8" />
      <circle cx="118" cy="78" r="4" fill="#B85C6E" />
      <circle cx="86" cy="118" r="7" fill="#E8C4C8" />
      <circle cx="48" cy="142" r="5" fill="#7D9B76" opacity="0.8" />
      <path
        d="M98 78C108 62 128 54 148 58C132 72 118 78 98 78Z"
        fill="#7D9B76"
        opacity="0.45"
      />
    </svg>
  );
}
