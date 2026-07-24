/** Sự kiện toàn cục để mở MIRATS AI kèm câu hỏi soạn sẵn. */
export const ASK_AI_EVENT = "mirats:ask-ai";

export type AskAiDetail = { prompt: string };

/** Phát sự kiện mở panel AI và tự gửi câu hỏi. */
export function askMiratsAi(prompt: string) {
  const text = prompt.trim();
  if (!text) return;
  window.dispatchEvent(new CustomEvent<AskAiDetail>(ASK_AI_EVENT, { detail: { prompt: text } }));
}
