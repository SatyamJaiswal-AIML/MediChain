const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface PredictionResult {
  disease: string;
  confidence: number;
  rank: number;
}

export interface DiseasePredictResponse {
  success: boolean;
  predictions: PredictionResult[];
  symptoms_analyzed: string[];
  matched_count: number;
  unmatched_symptoms: string[];
  model_name: string;
}

export async function fetchSymptoms(search?: string): Promise<string[]> {
  const url = new URL(`${API_BASE_URL}/api/symptoms`);
  if (search) {
    url.searchParams.set("search", search);
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error("Failed to fetch symptoms list");
  }
  const data = await res.json();
  return data.symptoms || [];
}

export async function predictDisease(symptoms: string[], topK: number = 5): Promise<DiseasePredictResponse> {
  const res = await fetch(`${API_BASE_URL}/api/predict-disease`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ symptoms, top_k: topK }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || "Failed to predict disease");
  }

  return res.json();
}
