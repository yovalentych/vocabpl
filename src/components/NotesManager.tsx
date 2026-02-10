"use client";

import { useEffect, useState } from "react";
import NotesModal from "@/components/NotesModal";
import { useAuthStatus } from "@/components/useAuthStatus";

export default function NotesManager() {
  const [open, setOpen] = useState(false);
  const { loading, isAuthenticated, isActive } = useAuthStatus();

  useEffect(() => {
    if (loading || !isAuthenticated || !isActive) return;
    function onOpen() {
      setOpen(true);
    }
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "m") {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("open-notes-modal", onOpen);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("open-notes-modal", onOpen);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [loading, isAuthenticated, isActive]);

  if (loading || !isAuthenticated || !isActive) return null;

  return <NotesModal open={open} onClose={() => setOpen(false)} />;
}
