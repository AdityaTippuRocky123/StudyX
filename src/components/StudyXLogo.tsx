import React from "react";

interface StudyXLogoProps {
  className?: string;
  iconOnly?: boolean;
}

export default function StudyXLogo({ className = "w-10 h-10", iconOnly = false }: StudyXLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-white"
        >
          {/* SpaceX style sweeping diagonal swoop of the X */}
          <path
            d="M 32 58 C 45 54 62 44 94 36 C 70 43 50 51 32 58 Z"
            fill="currentColor"
          />
          {/* Crossing straight diagonal bar of the X */}
          <path
            d="M 36 44 L 43 41 L 62 57 L 55 60 Z"
            fill="currentColor"
          />
          {/* Subtle glow / styling detail */}
          <path
            d="M 32 58 L 55 60"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeLinecap="round"
            opacity="0.3"
          />
        </svg>
      </div>

      {!iconOnly && (
        <div className="flex flex-col justify-center leading-none">
          <span className="text-sm font-black tracking-[0.18em] text-white uppercase font-sans">
            Study<span className="text-yellow-500">X</span>
          </span>
          <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5">
            Study with friends
          </span>
        </div>
      )}
    </div>
  );
}
