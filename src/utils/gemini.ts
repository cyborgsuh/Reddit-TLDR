import { SentimentResult, AggregatedResult } from '../types';

// Check if we're in development or production
const isDevelopment = import.meta.env.DEV;

async function callGeminiAPI(endpoint: string, payload: any): Promise<any> {
  const url = isDevelopment 
    ? `http://localhost:5173/api/gemini/${endpoint}`
    : `/api/gemini/${endpoint}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function analyzeSentiment(
  record: { combined: string; comments?: string[] },
  keyword: string,
  apiKey: string,
  maxRetries: number = 3
): Promise<SentimentResult | null> {
  try {
    const result = await callGeminiAPI('analyze-sentiment', {
      record,
      keyword,
      apiKey,
      maxRetries
    });
    
    return result as SentimentResult;
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return null;
  }
}

export async function aggregateResults(
  positives: string[],
  negatives: string[],
  keyword: string,
  apiKey: string,
  maxRetries: number = 3
): Promise<AggregatedResult | null> {
  try {
    const result = await callGeminiAPI('aggregate-results', {
      positives,
      negatives,
      keyword,
      apiKey,
      maxRetries
    });
    
    return result as AggregatedResult;
  } catch (error) {
    console.error('Error aggregating results:', error);
    return null;
  }
}