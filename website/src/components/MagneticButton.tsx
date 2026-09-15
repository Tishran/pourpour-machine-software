import { useRef, type ReactNode } from "react";
import { story } from "../data/story";
export default function MagneticButton({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      className={`action ${className}`}
      onClick={onClick}
      onPointerMove={(e) => {
        if (story.reduced || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        if (ref.current)
          ref.current.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.045}px, ${(e.clientY - r.top - r.height / 2) * 0.09}px)`;
      }}
      onPointerLeave={() => {
        if (ref.current) ref.current.style.transform = "";
      }}
    >
      {children}
      <span aria-hidden="true">↗</span>
    </button>
  );
}
