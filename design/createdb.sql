-- Enable the uuid-ossp extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  base_price_in_eur_cents INTEGER NOT NULL,
  name VARCHAR(60) NOT NULL,
  description_internal TEXT
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(40) NOT NULL UNIQUE,
  email VARCHAR(70) NOT NULL UNIQUE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  last_name VARCHAR(40),
  img TEXT,
  second_last_name VARCHAR(40),
  password VARCHAR(60) NOT NULL,
  password_reset_token VARCHAR(64),
  password_reset_expires TIMESTAMP,
  oauth_registration VARCHAR(4),
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  is_early_adopter BOOLEAN NOT NULL DEFAULT FALSE,
  language VARCHAR(2) NOT NULL DEFAULT 'en',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE weights (
  date DATE NOT NULL, -- Just day, month and year
  user_id UUID NOT NULL REFERENCES users(id), 
  value REAL,
  PRIMARY KEY (date, user_id) 
);

CREATE TABLE workout_template (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(40) NOT NULL,
  description VARCHAR(500)
);

CREATE TABLE workouts (
  id UUID PRIMARY KEY  DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES workout_template(id),
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
  name VARCHAR(40) NOT NULL,
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
  notes VARCHAR(400),
  PRIMARY KEY (workout_id, exercise_id, exercise_set)
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  amount_in_eur REAL NOT NULL,
  stripe_subscription_id TEXT,
  next_payment_date DATE,
  marked_for_cancel BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL
);