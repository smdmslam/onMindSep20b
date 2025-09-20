/*
  # Add Sample Mood Data

  1. Purpose
    - Add sample mood data entries to demonstrate mood tracking functionality
    - Create realistic journal entries with mood tags for testing visualization
    - Provide example data spanning multiple days

  2. Sample Data
    - Creates 14 days of journal entries with mood tags
    - Includes various moods: joyful, calm, anxious, sad, angry
    - Each entry has realistic content and timestamps
*/

-- Add sample journal entries with mood tags
INSERT INTO entries (
  user_id,
  title,
  content,
  category,
  tags,
  created_at
)
SELECT
  auth.uid(),
  'Morning Reflection - ' || to_char(day, 'Mon DD'),
  CASE (random() * 5)::int
    WHEN 0 THEN 'Started the day with meditation. Feeling centered and ready for whatever comes my way.'
    WHEN 1 THEN 'Woke up excited about the upcoming project presentation. Energy levels are high!'
    WHEN 2 THEN 'Bit of anxiety about the pending deadlines, but taking deep breaths and breaking tasks into smaller pieces.'
    WHEN 3 THEN 'Missing old friends today. Thinking about reaching out to reconnect.'
    WHEN 4 THEN 'Frustrated with the technical issues that came up yesterday. Need to find a better solution.'
  END,
  'Journal',
  CASE (random() * 5)::int
    WHEN 0 THEN ARRAY['Journal', 'mood:joyful']
    WHEN 1 THEN ARRAY['Journal', 'mood:calm']
    WHEN 2 THEN ARRAY['Journal', 'mood:anxious']
    WHEN 3 THEN ARRAY['Journal', 'mood:sad']
    WHEN 4 THEN ARRAY['Journal', 'mood:angry']
  END,
  day
FROM generate_series(
  current_date - interval '13 days',
  current_date,
  interval '1 day'
) AS day
WHERE EXISTS (
  SELECT 1 FROM auth.users WHERE id = auth.uid()
);

-- Add some entries with multiple moods per day
INSERT INTO entries (
  user_id,
  title,
  content,
  category,
  tags,
  created_at
)
SELECT
  auth.uid(),
  'Evening Check-in - ' || to_char(day, 'Mon DD'),
  CASE (random() * 5)::int
    WHEN 0 THEN 'Day turned out better than expected. Client loved the presentation!'
    WHEN 1 THEN 'Peaceful evening walk helped clear my mind. Grateful for these moments.'
    WHEN 2 THEN 'Some unexpected challenges came up. Working on staying grounded.'
    WHEN 3 THEN 'Reflecting on past decisions. Learning from the experience.'
    WHEN 4 THEN 'Need to work on managing stress better. Tomorrow is a new day.'
  END,
  'Journal',
  CASE (random() * 5)::int
    WHEN 0 THEN ARRAY['Journal', 'mood:joyful']
    WHEN 1 THEN ARRAY['Journal', 'mood:calm']
    WHEN 2 THEN ARRAY['Journal', 'mood:anxious']
    WHEN 3 THEN ARRAY['Journal', 'mood:sad']
    WHEN 4 THEN ARRAY['Journal', 'mood:angry']
  END,
  day + interval '12 hours'
FROM generate_series(
  current_date - interval '13 days',
  current_date,
  interval '1 day'
) AS day
WHERE random() > 0.5  -- Only create evening entries for some days
  AND EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid()
  );