
CREATE TABLE IF NOT EXISTS study_areas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  area_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, REVIEWING, COMPLETED
  notes TEXT,
  time_spent INTEGER DEFAULT 0,
  last_studied DATETIME,
  review_level INTEGER DEFAULT 0,
  next_review_at DATETIME,
  FOREIGN KEY(area_id) REFERENCES study_areas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL,
  type TEXT NOT NULL, -- link, video, book, pdf
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  watched BOOLEAN DEFAULT 0,
  video_notes TEXT,
  FOREIGN KEY(topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS study_logs (
  date TEXT PRIMARY KEY, -- YYYY-MM-DD
  count INTEGER DEFAULT 0
);
