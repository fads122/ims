"use client";

export function AnimatedBackground() {
  // Plain background - no animations or effects
  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    />
  );
}

