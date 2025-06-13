export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { positives, negatives, keyword, apiKey, maxRetries = 3 } = req.body;

    if (!positives || !negatives || !keyword || !apiKey) {
      res.status(400).json({ error: 'Missing required fields: positives, negatives, keyword, apiKey' });
      return;
    }

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

    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
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
          console.warn(`Rate limited (429). Attempt ${attempt + 1}/${maxRetries}. Retrying after 5 seconds...`);
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            continue;
          }
          res.status(429).json({ error: 'Rate limited. Please wait before making another request.' });
          return;
        }

        if (response.status === 503) {
          console.warn(`Service unavailable (503). Attempt ${attempt + 1}/${maxRetries}. Retrying after 5 seconds...`);
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            continue;
          }
          res.status(503).json({ error: 'Service temporarily unavailable. Please try again later.' });
          return;
        }

        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Clean JSON response
        let cleaned = responseText.trim();
        cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/g, '');
        cleaned = cleaned.replace(/```$/g, '');
        cleaned = cleaned.trim();

        const result = JSON.parse(cleaned);
        res.status(200).json(result);
        return;
      } catch (error) {
        console.error(`Gemini API error (attempt ${attempt + 1}/${maxRetries}):`, error);
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          res.status(500).json({ error: 'Failed to aggregate results' });
          return;
        }
      }
    }
  } catch (error) {
    console.error('Error in result aggregation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}