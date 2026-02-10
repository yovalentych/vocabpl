"use client";

import { useEffect, useRef } from "react";

export default function FooterObserver({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const height = el.offsetHeight || 0;
      document.documentElement.style.setProperty("--footer-height", `${height}px`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref}>{children}</div>;
}
