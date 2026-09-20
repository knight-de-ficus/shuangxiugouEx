export interface HealthResponse {
  status: "ok";
  database: "ok";
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch("/api/health", {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Health check failed with HTTP ${response.status}.`);
  }

  const value = (await response.json()) as Partial<HealthResponse>;
  if (value.status !== "ok" || value.database !== "ok") {
    throw new Error("Health check returned an unexpected response.");
  }
  return value as HealthResponse;
}

