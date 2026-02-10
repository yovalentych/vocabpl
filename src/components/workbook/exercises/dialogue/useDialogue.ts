import { useState } from "react";

export interface DialogueTurn {
  role: "user" | "ai";
  text: string;
}

export interface DialoguePack {
  id: string;
  title: string;
  scenario: string;
  level: string;
}

export function useDialogue() {
  const [pack, setPack] = useState<DialoguePack | null>(null);
  const [roleplay, setRoleplay] = useState<DialogueTurn[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"static" | "ai">("static");
  const [startBy, setStartBy] = useState<"user" | "ai">("ai");

  async function startRoleplay(startByParam: "user" | "ai" = "ai", locale: string = "pl"): Promise<boolean> {
    setLoading(true);
    setError(null);
    setRoleplay([]);
    setStartBy(startByParam);

    // If user starts, just reset and return
    if (startByParam === "user") {
      setLoading(false);
      return true;
    }

    // AI starts the conversation
    try {
      const payload = {
        exerciseType: "mini_dialog",
        action: "roleplay_turn",
        sessionId: "local",
        userText: "",
        history: [],
        startBy: "ai"
      };

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "mini_dialog_roleplay",
          userInput: JSON.stringify(payload),
          context: JSON.stringify({ uiLanguage: locale })
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "AI error");
        return false;
      }

      // Parse JSON response
      const parsed = JSON.parse(String(data?.text || ""));
      if (parsed?.aiText) {
        setRoleplay([{ role: "ai", text: parsed.aiText }]);
        return true;
      } else {
        setError("Invalid AI response");
        return false;
      }
    } catch (err) {
      setError("Network error");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(message: string, locale: string = "pl"): Promise<boolean> {
    if (!message.trim()) return false;

    // Add user message
    const newRoleplay: DialogueTurn[] = [...roleplay, { role: "user", text: message }];
    setRoleplay(newRoleplay);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const payload = {
        exerciseType: "mini_dialog",
        action: "roleplay_turn",
        sessionId: "local",
        userText: message,
        history: newRoleplay,
        startBy
      };

      const res = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "mini_dialog_roleplay",
          userInput: JSON.stringify(payload),
          context: JSON.stringify({ uiLanguage: locale })
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "AI error");
        return false;
      }

      // Parse JSON response
      const parsed = JSON.parse(String(data?.text || ""));
      if (parsed?.aiText) {
        setRoleplay([...newRoleplay, { role: "ai", text: parsed.aiText }]);
        return true;
      } else {
        setError("Invalid AI response");
        return false;
      }
    } catch (err) {
      setError("Network error");
      return false;
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setRoleplay([]);
    setInput("");
    setError(null);
    setPack(null);
  }

  return {
    // State
    pack,
    roleplay,
    input,
    loading,
    error,
    mode,
    startBy,

    // Actions
    setPack,
    setInput,
    setMode,
    setStartBy,
    startRoleplay,
    sendMessage,
    reset
  };
}
