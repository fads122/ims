"use client";

export function AnimatedBackground() {
  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Grid pattern background - light mode */}
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(156, 163, 175, 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(156, 163, 175, 0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Grid pattern background - dark mode */}
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(75, 85, 99, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(75, 85, 99, 0.2) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}

