CREATE TABLE exam_config (
  id SERIAL PRIMARY KEY,
  config_json JSONB,
  is_active BOOLEAN DEFAULT FALSE
);

CREATE TABLE student_attempts (
  id SERIAL PRIMARY KEY,
  roll_number VARCHAR(50),
  class VARCHAR(20),
  section VARCHAR(20),
  score INTEGER,
  max_score INTEGER,
  percentage FLOAT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  answers_json JSONB
);