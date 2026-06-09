-- =============================================
-- Copa26 AI — Seed Data: 48 World Cup 2026 Teams
-- All confirmed teams with real groups
-- =============================================

INSERT INTO teams (name, short_name, iso_code, group_letter, fifa_ranking, confederation) VALUES
-- Group A
('Morocco', 'MAR', 'ma', 'A', 14, 'CAF'),
('Canada', 'CAN', 'ca', 'A', 41, 'CONCACAF'),
('Argentina', 'ARG', 'ar', 'A', 1, 'CONMEBOL'),
('Uzbekistan', 'UZB', 'uz', 'A', 63, 'AFC'),

-- Group B
('Mexico', 'MEX', 'mx', 'B', 15, 'CONCACAF'),
('Colombia', 'COL', 'co', 'B', 10, 'CONMEBOL'),
('Ecuador', 'ECU', 'ec', 'B', 29, 'CONMEBOL'),
('Côte d''Ivoire', 'CIV', 'ci', 'B', 39, 'CAF'),

-- Group C
('USA', 'USA', 'us', 'C', 11, 'CONCACAF'),
('England', 'ENG', 'gb-eng', 'C', 5, 'UEFA'),
('Türkiye', 'TUR', 'tr', 'C', 35, 'UEFA'),
('Panama', 'PAN', 'pa', 'C', 44, 'CONCACAF'),

-- Group D
('Brazil', 'BRA', 'br', 'D', 4, 'CONMEBOL'),
('Egypt', 'EGY', 'eg', 'D', 33, 'CAF'),
('Germany', 'GER', 'de', 'D', 9, 'UEFA'),
('Tunisia', 'TUN', 'tn', 'D', 36, 'CAF'),

-- Group E
('France', 'FRA', 'fr', 'E', 2, 'UEFA'),
('Jordan', 'JOR', 'jo', 'E', 68, 'AFC'),
('Czechia', 'CZE', 'cz', 'E', 40, 'UEFA'),
('Haiti', 'HAI', 'ht', 'E', 81, 'CONCACAF'),

-- Group F
('Spain', 'ESP', 'es', 'F', 3, 'UEFA'),
('Netherlands', 'NED', 'nl', 'F', 6, 'UEFA'),
('Paraguay', 'PAR', 'py', 'F', 51, 'CONMEBOL'),
('Algeria', 'ALG', 'dz', 'F', 28, 'CAF'),

-- Group G
('Portugal', 'POR', 'pt', 'G', 7, 'UEFA'),
('Norway', 'NOR', 'no', 'G', 22, 'UEFA'),
('Ghana', 'GHA', 'gh', 'G', 59, 'CAF'),
('New Zealand', 'NZL', 'nz', 'G', 93, 'OFC'),

-- Group H
('Belgium', 'BEL', 'be', 'H', 8, 'UEFA'),
('Japan', 'JPN', 'jp', 'H', 13, 'AFC'),
('Scotland', 'SCO', 'gb-sct', 'H', 45, 'UEFA'),
('Congo DR', 'COD', 'cd', 'H', 56, 'CAF'),

-- Group I
('Croatia', 'CRO', 'hr', 'I', 12, 'UEFA'),
('Korea Republic', 'KOR', 'kr', 'I', 21, 'AFC'),
('Saudi Arabia', 'KSA', 'sa', 'I', 55, 'AFC'),
('Cabo Verde', 'CPV', 'cv', 'I', 62, 'CAF'),

-- Group J
('Uruguay', 'URU', 'uy', 'J', 16, 'CONMEBOL'),
('Austria', 'AUT', 'at', 'J', 23, 'UEFA'),
('Iran', 'IRN', 'ir', 'J', 26, 'AFC'),
('Curaçao', 'CUW', 'cw', 'J', 84, 'CONCACAF'),

-- Group K
('Switzerland', 'SUI', 'ch', 'K', 17, 'UEFA'),
('Australia', 'AUS', 'au', 'K', 24, 'AFC'),
('Senegal', 'SEN', 'sn', 'K', 20, 'CAF'),
('South Africa', 'RSA', 'za', 'K', 54, 'CAF'),

-- Group L
('Sweden', 'SWE', 'se', 'L', 25, 'UEFA'),
('Iraq', 'IRQ', 'iq', 'L', 34, 'AFC'),
('Bosnia-Herzegovina', 'BIH', 'ba', 'L', 50, 'UEFA'),
('Qatar', 'QAT', 'qa', 'L', 42, 'AFC')

ON CONFLICT (iso_code) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  group_letter = EXCLUDED.group_letter,
  fifa_ranking = EXCLUDED.fifa_ranking,
  confederation = EXCLUDED.confederation;

-- Update flag URLs using flagcdn.com
UPDATE teams SET flag_url = 'https://flagcdn.com/w80/' || iso_code || '.png';
