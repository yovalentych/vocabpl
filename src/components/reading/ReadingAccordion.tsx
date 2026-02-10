"use client";

import { useState, type ReactNode } from "react";
import { CaretDown } from "@phosphor-icons/react";

interface ReadingAccordionProps {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

export default function ReadingAccordion({
  title,
  icon,
  defaultOpen = false,
  children
}: ReadingAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-3xl border border-ink/10 bg-paper/80 shadow-soft overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-6 text-left transition hover:bg-ink/5"
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-xl font-semibold">{title}</h3>
        </div>
        <CaretDown
          size={20}
          className={`text-ink/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}
