CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  title TEXT NOT NULL,
  saved_at TEXT NOT NULL,
  level_json TEXT NOT NULL
);
CREATE INDEX activities_saved_at_idx ON activities(saved_at DESC);

CREATE TABLE attempts (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  activity_title TEXT NOT NULL,
  student_name TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  accuracy INTEGER NOT NULL
);
CREATE INDEX attempts_completed_at_idx ON attempts(completed_at DESC);
CREATE INDEX attempts_activity_id_idx ON attempts(activity_id);
