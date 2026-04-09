export class LlmUnavailableError extends Error {
  readonly userMessage: string;

  constructor(userMessage: string, cause?: unknown) {
    const technical = cause instanceof Error ? cause.message : 'LLM is unavailable';
    super(technical);
    this.name = 'LlmUnavailableError';
    this.cause = cause;
    this.userMessage = userMessage;
  }
}

export interface AskLlmOptions {
  baseUrl: string;
  model: string;
  prompt: string;
  timeoutMs: number;
}

export async function askLlm({
  baseUrl,
  model,
  prompt,
  timeoutMs,
}: AskLlmOptions): Promise<string> {
  let response: Response;

  try {
    response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new LlmUnavailableError(
        'Модель слишком долго думала и уснула 😴 Попробуй ещё разок!',
        error,
      );
    }
    throw new LlmUnavailableError(
      'Мозг бота сейчас недоступен 🧠💤 Попробуй чуть позже!',
      error,
    );
  }

  if (!response.ok) {
    throw new LlmUnavailableError(
      'Что-то пошло не так у модели 🤯 Попробуй ещё раз!',
      new Error(`Ollama returned ${response.status} ${response.statusText}`),
    );
  }

  const data = (await response.json()) as { response?: string };
  const text = (data.response ?? '').trim();

  if (!text) {
    throw new LlmUnavailableError(
      'Модель подумала-подумала… и промолчала 🤐 Попробуй переформулировать!',
      new Error('Ollama returned an empty response'),
    );
  }

  return text;
}
