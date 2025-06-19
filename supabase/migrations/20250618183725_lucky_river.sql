/*
  # Add comprehensive mentions and keyword tracking system

  1. New Tables
    - Update `user_settings` to include saved keywords
    - `user_mentions` - stores all mentions found for users
    - `keyword_searches` - tracks search history and scheduling
    - `reputation_scores` - stores calculated reputation metrics

  2. Security
    - Enable RLS on all new tables
    - Add policies for users to access their own data

  3. Functions
    - Add functions for reputation calculation
    - Add triggers for automatic updates
*/

-- Add saved_keywords to user_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'saved_keywords'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN saved_keywords text[] DEFAULT '{}';
  END IF;
END $$;

-- Create user_mentions table
CREATE TABLE IF NOT EXISTS user_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  platform text DEFAULT 'reddit' CHECK (platform IN ('reddit', 'twitter', 'facebook', 'instagram', 'linkedin')),
  author text NOT NULL,
  content text NOT NULL,
  sentiment text NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
  subreddit text,
  post_id text,
  comment_id text,
  url text,
  score integer DEFAULT 0,
  num_comments integer DEFAULT 0,
  num_shares integer DEFAULT 0,
  tags text[] DEFAULT '{}',
  mentioned_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, platform, post_id, comment_id)
);

-- Create keyword_searches table
CREATE TABLE IF NOT EXISTS keyword_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  last_searched_at timestamptz,
  next_search_at timestamptz DEFAULT now(),
  search_frequency_hours integer DEFAULT 24,
  is_active boolean DEFAULT true,
  total_mentions_found integer DEFAULT 0,
  last_error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, keyword)
);

-- Create reputation_scores table
CREATE TABLE IF NOT EXISTS reputation_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  overall_score integer DEFAULT 0,
  positive_mentions integer DEFAULT 0,
  negative_mentions integer DEFAULT 0,
  neutral_mentions integer DEFAULT 0,
  mixed_mentions integer DEFAULT 0,
  total_mentions integer DEFAULT 0,
  sentiment_ratio decimal(5,2) DEFAULT 0.0,
  engagement_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on all new tables
ALTER TABLE user_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE reputation_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for user_mentions
CREATE POLICY "Users can view their own mentions"
  ON user_mentions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert mentions"
  ON user_mentions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mentions"
  ON user_mentions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for keyword_searches
CREATE POLICY "Users can manage their own keyword searches"
  ON keyword_searches
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for reputation_scores
CREATE POLICY "Users can view their own reputation scores"
  ON reputation_scores
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage reputation scores"
  ON reputation_scores
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_user_mentions_updated_at
  BEFORE UPDATE ON user_mentions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_keyword_searches_updated_at
  BEFORE UPDATE ON keyword_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reputation_scores_updated_at
  BEFORE UPDATE ON reputation_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_mentions_user_id ON user_mentions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mentions_keyword ON user_mentions(keyword);
CREATE INDEX IF NOT EXISTS idx_user_mentions_sentiment ON user_mentions(sentiment);
CREATE INDEX IF NOT EXISTS idx_user_mentions_mentioned_at ON user_mentions(mentioned_at);
CREATE INDEX IF NOT EXISTS idx_user_mentions_platform ON user_mentions(platform);

CREATE INDEX IF NOT EXISTS idx_keyword_searches_user_id ON keyword_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_keyword_searches_next_search ON keyword_searches(next_search_at);
CREATE INDEX IF NOT EXISTS idx_keyword_searches_active ON keyword_searches(is_active);

CREATE INDEX IF NOT EXISTS idx_reputation_scores_user_id ON reputation_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_scores_date ON reputation_scores(date);

-- Function to calculate reputation score
CREATE OR REPLACE FUNCTION calculate_reputation_score(
  p_positive integer,
  p_negative integer,
  p_neutral integer,
  p_mixed integer
) RETURNS integer AS $$
DECLARE
  total_mentions integer;
  weighted_score decimal;
BEGIN
  total_mentions := p_positive + p_negative + p_neutral + p_mixed;
  
  IF total_mentions = 0 THEN
    RETURN 50; -- Neutral score when no mentions
  END IF;
  
  -- Calculate weighted score (positive=1, mixed=0.5, neutral=0.3, negative=0)
  weighted_score := (
    (p_positive * 1.0) + 
    (p_mixed * 0.5) + 
    (p_neutral * 0.3) + 
    (p_negative * 0.0)
  ) / total_mentions;
  
  -- Convert to 0-100 scale
  RETURN LEAST(100, GREATEST(0, ROUND(weighted_score * 100)));
END;
$$ LANGUAGE plpgsql;

-- Function to update daily reputation scores
CREATE OR REPLACE FUNCTION update_daily_reputation_scores()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  mention_stats RECORD;
  reputation_score integer;
  sentiment_ratio decimal;
  engagement_score integer;
BEGIN
  -- Loop through all users who have mentions
  FOR user_record IN 
    SELECT DISTINCT user_id FROM user_mentions
  LOOP
    -- Get mention statistics for today
    SELECT 
      COUNT(*) FILTER (WHERE sentiment = 'positive') as positive_count,
      COUNT(*) FILTER (WHERE sentiment = 'negative') as negative_count,
      COUNT(*) FILTER (WHERE sentiment = 'neutral') as neutral_count,
      COUNT(*) FILTER (WHERE sentiment = 'mixed') as mixed_count,
      COUNT(*) as total_count,
      AVG(score) as avg_engagement
    INTO mention_stats
    FROM user_mentions 
    WHERE user_id = user_record.user_id 
    AND DATE(mentioned_at) = CURRENT_DATE;
    
    -- Calculate scores
    reputation_score := calculate_reputation_score(
      COALESCE(mention_stats.positive_count, 0),
      COALESCE(mention_stats.negative_count, 0),
      COALESCE(mention_stats.neutral_count, 0),
      COALESCE(mention_stats.mixed_count, 0)
    );
    
    sentiment_ratio := CASE 
      WHEN COALESCE(mention_stats.total_count, 0) > 0 THEN
        COALESCE(mention_stats.positive_count, 0)::decimal / mention_stats.total_count * 100
      ELSE 0
    END;
    
    engagement_score := LEAST(100, GREATEST(0, COALESCE(mention_stats.avg_engagement, 0)));
    
    -- Upsert reputation score for today
    INSERT INTO reputation_scores (
      user_id, date, overall_score, positive_mentions, negative_mentions,
      neutral_mentions, mixed_mentions, total_mentions, sentiment_ratio, engagement_score
    ) VALUES (
      user_record.user_id, CURRENT_DATE, reputation_score,
      COALESCE(mention_stats.positive_count, 0),
      COALESCE(mention_stats.negative_count, 0),
      COALESCE(mention_stats.neutral_count, 0),
      COALESCE(mention_stats.mixed_count, 0),
      COALESCE(mention_stats.total_count, 0),
      sentiment_ratio,
      engagement_score
    )
    ON CONFLICT (user_id, date) 
    DO UPDATE SET
      overall_score = EXCLUDED.overall_score,
      positive_mentions = EXCLUDED.positive_mentions,
      negative_mentions = EXCLUDED.negative_mentions,
      neutral_mentions = EXCLUDED.neutral_mentions,
      mixed_mentions = EXCLUDED.mixed_mentions,
      total_mentions = EXCLUDED.total_mentions,
      sentiment_ratio = EXCLUDED.sentiment_ratio,
      engagement_score = EXCLUDED.engagement_score,
      updated_at = now();
  END LOOP;
END;
$$ LANGUAGE plpgsql;