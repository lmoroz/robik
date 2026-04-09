export interface OllamaModel {
  name: string;
}

export async function listModels(baseUrl: string): Promise<OllamaModel[]> {
  const response = await fetch(`${baseUrl}/api/tags`);
  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as { models?: { name: string }[] };
  const models = data.models ?? [];

  return models.filter((m) => !m.name.includes('embed'));
}

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
  system?: string;
  timeoutMs: number;
}

export async function askLlm({
  baseUrl,
  model,
  prompt,
  system,
  timeoutMs,
}: AskLlmOptions): Promise<string> {
  let response: Response;

  const body: Record<string, unknown> = { model, prompt, stream: false };
  if (system) body.system = system;

  try {
    response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
