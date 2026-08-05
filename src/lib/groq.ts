const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 25000;
const MIN_RETRY_WAIT_MS = 3000;
const MAX_RETRY_WAIT_MS = 15000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(message: string): number {
  const match = message.match(/try again in ([\d.]+)s/i);
  const reported = match ? Math.ceil(parseFloat(match[1]) * 1000) + 500 : 5000;
  return Math.min(Math.max(reported, MIN_RETRY_WAIT_MS), MAX_RETRY_WAIT_MS);
}

export async function callGroqChat(
  apiKey: string,
  body: Record<string, unknown>
): Promise<{ content?: string; error?: string }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      console.error("Groq fetch failed", err);
      return { error: "Falha ao conectar com a Groq. Tente novamente." };
    }
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      return { content: data.choices?.[0]?.message?.content };
    }

    const bodyText = await response.text().catch(() => "");
    let detail = bodyText;
    try {
      detail = JSON.parse(bodyText)?.error?.message ?? bodyText;
    } catch {
      // corpo não é JSON, usa o texto cru mesmo
    }
    console.error("Groq API error", response.status, bodyText);

    if ((response.status === 429 || response.status === 413) && attempt === 0) {
      await sleep(response.status === 429 ? parseRetryAfterMs(detail) : MIN_RETRY_WAIT_MS);
      continue;
    }

    return { error: `Groq respondeu com erro (${response.status})${detail ? `: ${detail}` : ""}.` };
  }

  return { error: "A Groq está com alta demanda no momento." };
}
