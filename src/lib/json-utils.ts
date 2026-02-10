/**
 * Safely parse JSON with error recovery attempts
 */
export function safeJSONParse<T = any>(text: string): { success: boolean; data?: T; error?: string } {
  // Check if JSON appears truncated (incomplete)
  if (text.trim().endsWith('"') && !text.trim().endsWith('"}') && !text.trim().endsWith('"]')) {
    return {
      success: false,
      error: "JSON виглядає неповним (можливо, досягнуто ліміт токенів AI). Спробуйте зменшити кількість питань."
    };
  }

  const trimmed = text.trim();
  if (!trimmed.endsWith('}') && !trimmed.endsWith(']')) {
    return {
      success: false,
      error: "JSON не закінчений - відповідь AI була обрізана. Спробуйте згенерувати менше питань."
    };
  }

  // Try direct parsing first
  try {
    const parsed = JSON.parse(text);
    return { success: true, data: parsed };
  } catch (firstError) {
    console.warn("First JSON parse failed, attempting cleanup...", firstError);
  }

  // Attempt 1: Remove markdown code blocks if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/```\s*$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned);
    return { success: true, data: parsed };
  } catch (secondError) {
    console.warn("Second JSON parse failed, attempting quote fixes...", secondError);
  }

  // Attempt 2: Fix common quote issues
  // Replace curly quotes with straight quotes
  cleaned = cleaned
    .replace(/[\u201C\u201D]/g, '"') // " "
    .replace(/[\u2018\u2019]/g, "'") // ' '
    .replace(/[\u2013\u2014]/g, "-"); // – —

  try {
    const parsed = JSON.parse(cleaned);
    return { success: true, data: parsed };
  } catch (thirdError) {
    console.warn("Third JSON parse failed, attempting structure fixes...", thirdError);
  }

  // Attempt 3: Try to extract JSON object from surrounding text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return { success: true, data: parsed };
    } catch (fourthError) {
      console.warn("Fourth JSON parse failed", fourthError);
    }
  }

  // All attempts failed
  return {
    success: false,
    error: "Failed to parse JSON after multiple cleanup attempts"
  };
}

/**
 * Extract error position info from JSON parse error
 */
export function getJSONErrorInfo(error: Error): { position?: number; line?: number; column?: number } {
  const match = error.message.match(/position (\d+)|line (\d+)|column (\d+)/gi);
  if (!match) return {};

  const info: { position?: number; line?: number; column?: number } = {};

  match.forEach(m => {
    const posMatch = m.match(/position (\d+)/i);
    if (posMatch) info.position = parseInt(posMatch[1]);

    const lineMatch = m.match(/line (\d+)/i);
    if (lineMatch) info.line = parseInt(lineMatch[1]);

    const colMatch = m.match(/column (\d+)/i);
    if (colMatch) info.column = parseInt(colMatch[1]);
  });

  return info;
}
