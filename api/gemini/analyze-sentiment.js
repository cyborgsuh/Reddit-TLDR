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
    const { record, keyword, apiKey, maxRetries = 3 } = req.body;

    if (!record || !keyword || !apiKey) {
      res.status(400).json({ error: 'Missing required fields: record, keyword, apiKey' });
      return;
    }

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
          res.status(500).json({ error: 'Failed to analyze sentiment' });
          return;
        }
      }
    }
  } catch (error) {
    console.error('Error in sentiment analysis:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}