"use client";

import Lottie from "lottie-react";
import { useRef, useEffect } from "react";

interface LottieAnimationProps {
  animationData: any;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
}

export function LottieAnimation({
  animationData,
  className = "",
  loop = true,
  autoplay = true,
}: LottieAnimationProps) {
  const lottieRef = useRef<any>(null);

  useEffect(() => {
    if (lottieRef.current && autoplay) {
      lottieRef.current.play();
    }
  }, [autoplay]);

  return (
    <div className={className}>
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

