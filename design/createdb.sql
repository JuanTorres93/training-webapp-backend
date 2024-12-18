-- Enable the uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  base_price_in_eur_cents INTEGER NOT NULL
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alias VARCHAR(40) NOT NULL UNIQUE,
  email VARCHAR(70) NOT NULL UNIQUE,
  last_name VARCHAR(40),
  img TEXT,
  second_last_name VARCHAR(40),
  password VARCHAR(60) NOT NULL,
  registeredviaoauth BOOLEAN NOT NULL,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  is_early_adopter BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE workouts (
  id UUID PRIMARY KEY  DEFAULT uuid_generate_v4(),
  alias VARCHAR(40) NOT NULL,
  description VARCHAR(500),
  created_by UUID NOT NULL REFERENCES users(id)
);

CREATE TABLE workout_template (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  alias VARCHAR(40) NOT NULL,
  description VARCHAR(500)
);

CREATE TABLE users_workouts (
  user_id UUID REFERENCES users(id),
  workout_id UUID REFERENCES workouts(id),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  PRIMARY KEY (user_id, workout_id, start_date)
);

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alias VARCHAR(40) NOT NULL,
  description VARCHAR(500)
);

CREATE TABLE users_exercises (
  user_id UUID REFERENCES users(id),
  exercise_id UUID REFERENCES exercises(id),
  PRIMARY KEY (user_id, exercise_id)
);

CREATE TABLE workout_template_exercises (
  workout_template_id UUID REFERENCES workout_template(id),
  exercise_id UUID REFERENCES exercises(id),
  exercise_order INTEGER NOT NULL,
  exercise_sets INTEGER NOT NULL,
  PRIMARY KEY (workout_template_id, exercise_id, exercise_order)
);

CREATE TABLE workouts_exercises (
  workout_id UUID REFERENCES workouts(id),
  exercise_id UUID REFERENCES exercises(id),
  exercise_set INTEGER NOT NULL,
  exercise_reps INTEGER,
  exercise_weight REAL,
  exercise_time_in_seconds INTEGER,
  PRIMARY KEY (workout_id, exercise_id, exercise_set)
);