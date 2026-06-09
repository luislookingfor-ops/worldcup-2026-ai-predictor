-- =============================================
-- Copa26 AI — World Cup 2026 Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- ==================
-- 1. TEAMS TABLE
-- ==================
CREATE TABLE IF NOT EXISTS teams (
  external_id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  short_name VARCHAR(50),
  tla VARCHAR(10),
  crest TEXT,
  address TEXT,
  website TEXT,
  founded INT,
  club_colors VARCHAR(100),
  venue VARCHAR(200),
  "group" VARCHAR(50),
  coach_name VARCHAR(100),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================
-- 2. MATCHES TABLE
-- ==================
CREATE TABLE IF NOT EXISTS matches (
  external_id INT PRIMARY KEY,
  utc_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) DEFAULT 'SCHEDULED',
  matchday INT,
  stage VARCHAR(100),
  "group" VARCHAR(50),
  home_team_id INT REFERENCES teams(external_id) ON DELETE SET NULL,
  home_team_name VARCHAR(100),
  home_team_crest TEXT,
  away_team_id INT REFERENCES teams(external_id) ON DELETE SET NULL,
  away_team_name VARCHAR(100),
  away_team_crest TEXT,
  home_score INT,
  away_score INT,
  winner VARCHAR(50),
  venue VARCHAR(200),
  last_updated TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================
-- 3. PROFILES TABLE (extends Supabase Auth)
-- ==================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  total_points INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================
-- 4. PREDICTIONS TABLE
-- ==================
CREATE TABLE IF NOT EXISTS predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  match_external_id INT REFERENCES matches(external_id) ON DELETE CASCADE NOT NULL,
  predicted_home_score INT NOT NULL CHECK (predicted_home_score >= 0),
  predicted_away_score INT NOT NULL CHECK (predicted_away_score >= 0),
  points_earned INT DEFAULT NULL,
  scored_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_external_id)
);

-- ==================
-- 5. AI PREDICTIONS TABLE (cached)
-- ==================
CREATE TABLE IF NOT EXISTS ai_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_external_id INT REFERENCES matches(external_id) ON DELETE CASCADE UNIQUE,
  home_team VARCHAR(100),
  away_team VARCHAR(100),
  prediction_text TEXT,
  thread_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================
-- 6. AGENT CONVERSATIONS LOG
-- ==================
CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  thread_id VARCHAR(100) NOT NULL,
  user_message TEXT NOT NULL,
  agent_response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================
-- 7. INDEXES
-- ==================
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(utc_date);
CREATE INDEX IF NOT EXISTS idx_matches_group ON matches("group");
CREATE INDEX IF NOT EXISTS idx_matches_stage ON matches(stage);
CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_external_id);
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);

-- ==================
-- 8. ROW LEVEL SECURITY
-- ==================
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;

-- Public read for teams, matches, ai_predictions, profiles
CREATE POLICY "teams_public_read" ON teams FOR SELECT USING (true);
CREATE POLICY "matches_public_read" ON matches FOR SELECT USING (true);
CREATE POLICY "ai_predictions_public_read" ON ai_predictions FOR SELECT USING (true);
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);

-- Users manage own profile
CREATE POLICY "profiles_own_update" ON profiles 
  FOR UPDATE USING ((SELECT auth.uid()) = id);
CREATE POLICY "profiles_own_insert" ON profiles 
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

-- Users manage own predictions
CREATE POLICY "predictions_own_select" ON predictions 
  FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "predictions_own_insert" ON predictions 
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "predictions_own_update" ON predictions 
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- Users manage own agent logs
CREATE POLICY "agent_conv_own_select" ON agent_conversations 
  FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "agent_conv_own_insert" ON agent_conversations 
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- ==================
-- 9. LEADERBOARD VIEW
-- ==================
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  p.id,
  p.username,
  p.display_name,
  p.avatar_url,
  COALESCE(SUM(pr.points_earned), 0) AS total_points,
  COUNT(pr.id) AS total_predictions,
  COUNT(CASE WHEN pr.points_earned > 0 THEN 1 END) AS correct_predictions,
  CASE 
    WHEN COUNT(pr.id) > 0 
    THEN ROUND(COUNT(CASE WHEN pr.points_earned > 0 THEN 1 END)::DECIMAL / COUNT(pr.id) * 100, 1)
    ELSE 0 
  END AS accuracy_pct
FROM profiles p
LEFT JOIN predictions pr ON p.id = pr.user_id
GROUP BY p.id, p.username, p.display_name, p.avatar_url
ORDER BY total_points DESC;

-- ==================
-- 10. AUTO-CREATE PROFILE ON USER SIGNUP
-- ==================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==================
-- 11. UPDATED_AT TRIGGER
-- ==================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER predictions_updated_at
  BEFORE UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
