export interface LlmResponse {
  content: string;
}

export async function askLlm(
  baseUrl: string,
  model: string,
  prompt: string,
): Promise<LlmResponse> {
  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { response: string };
  return { content: data.response };
}
