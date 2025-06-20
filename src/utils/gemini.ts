import { SentimentResult, AggregatedResult } from '../types';

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Module-level flag to remember if we should prefer the fallback model
let preferFallbackModel = false;

function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/g, '');
  cleaned = cleaned.replace(/```$/g, '');
  
  return cleaned.trim();
}

async function callGeminiAPI(prompt: string, apiKey: string, selectedModel: string, maxRetries: number = 3): Promise<string> {
  // Define fallback models for each primary model
  const fallbackModels: Record<string, string> = {
    'gemini-2.5-flash-preview-05-20': 'gemini-2.0-flash',
    'gemini-2.0-flash-exp': 'gemini-2.0-flash',
    'gemini-2.0-flash': 'gemini-1.5-flash',
    'gemini-2.0-flash-lite': 'gemini-1.5-flash',
    'gemini-1.5-flash': 'gemini-1.5-flash' // No fallback for this one
  };

  const fallbackModel = fallbackModels[selectedModel];

  // If we've previously encountered rate limiting or service issues with this model, use fallback directly
  if (preferFallbackModel && fallbackModel && fallbackModel !== selectedModel) {
    console.log(`Using fallback model (${fallbackModel}) due to previous issues with ${selectedModel}`);
    return await attemptWithModel(fallbackModel, prompt, apiKey, maxRetries);
  }

  // First try with the selected model
  try {
    return await attemptWithModel(selectedModel, prompt, apiKey, maxRetries);
  } catch (primaryError) {
    console.warn(`Primary model (${selectedModel}) failed:`, primaryError);
    
    // If primary model fails due to rate limiting or service issues, switch to fallback permanently
    if (primaryError instanceof Error && 
        (primaryError.message.includes('Rate limited') || 
         primaryError.message.includes('Service temporarily unavailable')) &&
        fallbackModel && fallbackModel !== selectedModel) {
      console.log(`Switching to fallback model permanently: ${fallbackModel}`);
      preferFallbackModel = true;
      
      try {
        return await attemptWithModel(fallbackModel, prompt, apiKey, maxRetries);
      } catch (fallbackError) {
        console.error(`Fallback model (${fallbackModel}) also failed:`, fallbackError);
        throw fallbackError;
      }
    }
    
    // If it's not a rate limiting issue, throw the original error
    throw primaryError;
  }
}

async function attemptWithModel(model: string, prompt: string, apiKey: string, maxRetries: number): Promise<string> {
  const url = `${GEMINI_API_BASE_URL}/${model}:generateContent?key=${apiKey}`;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      });

      if (response.status === 429) {
        console.warn(`Rate limited (429) for ${model}. Attempt ${attempt + 1}/${maxRetries}. Retrying after 5 seconds...`);
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }
        throw new Error('Rate limited. Please wait before making another request.');
      }

      if (response.status === 503) {
        console.warn(`Service unavailable (503) for ${model}. Attempt ${attempt + 1}/${maxRetries}. Retrying after 5 seconds...`);
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }
        throw new Error('Service temporarily unavailable. Please try again later.');
      }

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      console.error(`Gemini API error for ${model} (attempt ${attempt + 1}/${maxRetries}):`, error);
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        throw error;
      }
    }
  }
  
  throw new Error('Max retries exceeded');
}

export async function analyzeSentiment(
  record: { combined: string; comments?: string[] },
  keyword: string,
  apiKey: string,
  maxRetries: number = 3,
  selectedModel: string = 'gemini-2.0-flash'
): Promise<SentimentResult | null> {
  const commentsSection = record.comments && record.comments.length > 0
    ? `\nTop-level comments:\n${record.comments.join('\n')}`
    : '';

  const prompt = `You are a sentiment analysis expert. Your task is to analyze public opinion about the keyword: '${keyword}' using the following Reddit post and its top-level comments.

Instructions:
1. Carefully read the post and comments. Consider only statements that are directly relevant to the keyword.
2. Classify the overall sentiment toward the keyword as one of these four categories:
   - 'positive': The post and comments are mostly favorable/supportive.
   - 'negative': The post and comments are mostly critical/unfavorable.
   - 'mixed': There are both clear positive and negative points about the keyword.
   - 'neutral': No strong positive or negative opinions are expressed, or the discussion is ambiguous/off-topic.
3. Extract two lists:
   - 'positives': Factual, concise sentences describing advantages, strengths, or positive aspects of the keyword (from post or comments).
   - 'negatives': Factual, concise sentences describing disadvantages, weaknesses, or negative aspects of the keyword (from post or comments).
   Each item should be a fact-based, objective statement (not speculation or emotion).
4. Return your answer as a JSON object in the following format:

{
  "sentiment": "<positive | negative | mixed | neutral>",
  "explanation": "<a concise sentence explaining why this sentiment was chosen>",
  "positives": ["<positive point 1>", ...],
  "negatives": ["<negative point 1>", ...]
}

Reddit post:
${record.combined}${commentsSection}`;

  try {
    const response = await callGeminiAPI(prompt, apiKey, selectedModel, maxRetries);
    const cleaned = cleanJsonResponse(response);
    return JSON.parse(cleaned) as SentimentResult;
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
  maxRetries: number = 3,
  selectedModel: string = 'gemini-2.0-flash'
): Promise<AggregatedResult | null> {
  const prompt = `You are a language analyst specializing in summarizing factual insights from Reddit sentiment analysis.

You are given two lists, each containing factual statements about the keyword '${keyword}':
- The first list contains positive points (advantages, strengths, or positive aspects).
- The second list contains negative points (disadvantages, weaknesses, or negative aspects).

Your task is to:
- Remove duplicates or near-duplicates.
- Summarize and group similar points together for clarity.
- Write clear, concise, and objective summary points for each list.
- Return your answer as a JSON object in the following format:

{
  "positives": ["<summary of positive point 1>", ...],
  "negatives": ["<summary of negative point 1>", ...]
}

Positive points:
${JSON.stringify(positives, null, 2)}

Negative points:
${JSON.stringify(negatives, null, 2)}

Your output:
(Provide only the JSON object, do not include any extra text or formatting)`;

  try {
    const response = await callGeminiAPI(prompt, apiKey, selectedModel, maxRetries);
    const cleaned = cleanJsonResponse(response);
    return JSON.parse(cleaned) as AggregatedResult;
  } catch (error) {
    console.error('Error aggregating results:', error);
    return null;
  }
}