"use client";

import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

interface UseScrollAnimationOptions {
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;
  start?: string;
  end?: string;
  once?: boolean;
  delay?: number;
  duration?: number;
  ease?: string;
  stagger?: number;
}

export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;

      const {
        from = { opacity: 0, y: 60 },
        to = { opacity: 1, y: 0 },
        start = 'top 80%',
        end,
        once = true,
        delay = 0,
        duration = 1,
        ease = 'power3.out',
        stagger = 0,
      } = options;

      const animation = gsap.fromTo(
        ref.current,
        from,
        {
          ...to,
          duration,
          delay,
          ease,
          scrollTrigger: {
            trigger: ref.current,
            start,
            end,
            once,
            toggleActions: once ? 'play none none none' : 'play none none reverse',
          },
        }
      );

      if (stagger > 0 && ref.current.children.length > 0) {
        gsap.fromTo(
          ref.current.children,
          from,
          {
            ...to,
            duration,
            delay,
            ease,
            stagger: stagger / 1000,
            scrollTrigger: {
              trigger: ref.current,
              start,
              end,
              once,
            },
          }
        );
      }

      return () => {
        ScrollTrigger.getAll().forEach((st) => {
          if (st.trigger === ref.current) st.kill();
        });
      };
    },
    { scope: ref, dependencies: [JSON.stringify(options)] }
  );

  return ref;
}

