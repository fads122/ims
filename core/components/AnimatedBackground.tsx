"use client";

export function AnimatedBackground() {
  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
        {/* Dot grid pattern - light mode */}
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(156, 163, 175, 0.3) 1.5px, transparent 1.5px)',
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0',
          }}
        />
        {/* Dot grid pattern - dark mode */}
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(75, 85, 99, 0.35) 1.5px, transparent 1.5px)',
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0',
          }}
        />

        {/* Animated blurred gradient spots - light mode */}
        <div className="absolute inset-0 dark:hidden">
          <div
            className="absolute w-[500px] h-[500px] rounded-full opacity-[0.15] animate-float1"
            style={{
              left: "5%",
              top: "10%",
              background: "radial-gradient(circle, rgb(59, 130, 246) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />
          <div
            className="absolute w-[450px] h-[450px] rounded-full opacity-[0.12] animate-float2"
            style={{
              right: "8%",
              top: "35%",
              background: "radial-gradient(circle, rgb(168, 85, 247) 0%, transparent 70%)",
              filter: "blur(100px)",
            }}
          />
          <div
            className="absolute w-[400px] h-[400px] rounded-full opacity-[0.14] animate-float3"
            style={{
              left: "30%",
              bottom: "15%",
              background: "radial-gradient(circle, rgb(236, 72, 153) 0%, transparent 70%)",
              filter: "blur(90px)",
            }}
          />
          <div
            className="absolute w-[380px] h-[380px] rounded-full opacity-[0.11] animate-float4"
            style={{
              right: "20%",
              bottom: "8%",
              background: "radial-gradient(circle, rgb(34, 197, 94) 0%, transparent 70%)",
              filter: "blur(85px)",
            }}
          />
          <div
            className="absolute w-[420px] h-[420px] rounded-full opacity-[0.13] animate-float5"
            style={{
              left: "55%",
              top: "55%",
              background: "radial-gradient(circle, rgb(245, 158, 11) 0%, transparent 70%)",
              filter: "blur(95px)",
            }}
          />
          <div
            className="absolute w-[350px] h-[350px] rounded-full opacity-[0.12] animate-float1"
            style={{
              left: "70%",
              top: "20%",
              background: "radial-gradient(circle, rgb(139, 92, 246) 0%, transparent 70%)",
              filter: "blur(75px)",
            }}
          />
        </div>

        {/* Animated blurred gradient spots - dark mode */}
        <div className="absolute inset-0 hidden dark:block">
          <div
            className="absolute w-[500px] h-[500px] rounded-full opacity-[0.18] animate-float1"
            style={{
              left: "5%",
              top: "10%",
              background: "radial-gradient(circle, rgb(96, 165, 250) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />
          <div
            className="absolute w-[450px] h-[450px] rounded-full opacity-[0.15] animate-float2"
            style={{
              right: "8%",
              top: "35%",
              background: "radial-gradient(circle, rgb(192, 132, 252) 0%, transparent 70%)",
              filter: "blur(100px)",
            }}
          />
          <div
            className="absolute w-[400px] h-[400px] rounded-full opacity-[0.16] animate-float3"
            style={{
              left: "30%",
              bottom: "15%",
              background: "radial-gradient(circle, rgb(244, 114, 182) 0%, transparent 70%)",
              filter: "blur(90px)",
            }}
          />
          <div
            className="absolute w-[380px] h-[380px] rounded-full opacity-[0.14] animate-float4"
            style={{
              right: "20%",
              bottom: "8%",
              background: "radial-gradient(circle, rgb(74, 222, 128) 0%, transparent 70%)",
              filter: "blur(85px)",
            }}
          />
          <div
            className="absolute w-[420px] h-[420px] rounded-full opacity-[0.15] animate-float5"
            style={{
              left: "55%",
              top: "55%",
              background: "radial-gradient(circle, rgb(251, 191, 36) 0%, transparent 70%)",
              filter: "blur(95px)",
            }}
          />
          <div
            className="absolute w-[350px] h-[350px] rounded-full opacity-[0.15] animate-float1"
            style={{
              left: "70%",
              top: "20%",
              background: "radial-gradient(circle, rgb(167, 139, 250) 0%, transparent 70%)",
              filter: "blur(75px)",
            }}
          />
        </div>
      </div>
  );
}

