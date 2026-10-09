"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type CorgiMascotProps = {
  mood: "idle" | "correct" | "wrong";
  signal?: number;
  variant?: "card" | "hero";
};

export function CorgiMascot({ mood, signal = 0, variant = "card" }: CorgiMascotProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (signal === 0) {
      const frame = window.requestAnimationFrame(() => setIsVisible(false));

      return () => window.cancelAnimationFrame(frame);
    }

    const frame = window.requestAnimationFrame(() => setIsVisible(false));
    const showTimer = window.setTimeout(() => setIsVisible(true), 40);
    const timer = window.setTimeout(() => setIsVisible(false), 4200);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(showTimer);
      window.clearTimeout(timer);
    };
  }, [signal]);

  return (
    <div
      className={`mascot mascot-${mood} mascot-${variant} ${isVisible ? "mascot-visible" : "mascot-hidden"}`}
      aria-label="Corgi coach supports student"
    >
      <Image src="/corgi-dog-cutout-v2.png" alt="" width={272} height={306} priority />
      <div className="mascot-bubble" aria-hidden="true">
        <strong>Wow! 🔥</strong>
        <span>You are great!</span>
        <span>Carry on</span>
        <span>in the same spirit!</span>
      </div>
    </div>
  );
}
