export interface PostRecord {
  title: string;
  selftext: string;
  combined: string;
  comments?: string[];
  subreddit?: string;
  post_id?: string;
}

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'mixed' | 'neutral';
  explanation: string;
  positives: string[];
  negatives: string[];
}

export interface AnalysisResult {
  post: PostRecord;
  result: SentimentResult | null;
}

export interface AggregatedResult {
  positives: string[];
  negatives: string[];
}

export interface SentimentCounts {
  positive: number;
  negative: number;
  mixed: number;
  neutral: number;
}