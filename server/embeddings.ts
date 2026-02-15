const GEMINI_EMBEDDING_MODEL = "text-embedding-004";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY must be set to generate embeddings");
  }

  const response = await fetch(
    `${GEMINI_API_URL}/models/${GEMINI_EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${GEMINI_EMBEDDING_MODEL}`,
        content: {
          parts: [{ text }],
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini embedding API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.embedding.values;
}
