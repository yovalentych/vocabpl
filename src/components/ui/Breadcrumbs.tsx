"use client";

import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: Props) {
  return (
    <nav className="flex items-center gap-1.5 text-sm flex-wrap">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <CaretRight size={12} className="shrink-0 text-ink/25" />}
            {isLast || !item.href ? (
              <span className={isLast ? "font-medium text-ink" : "text-ink/50"}>
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href as any}
                className="text-ink/50 transition-colors hover:text-moss"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
