CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  alias VARCHAR(40) NOT NULL UNIQUE,
  email VARCHAR(70) NOT NULL UNIQUE,
  last_name VARCHAR(40),
  img TEXT,
  second_last_name VARCHAR(40),
  password VARCHAR(60) NOT NULL
);

CREATE TABLE workouts (
  id SERIAL PRIMARY KEY,
  alias VARCHAR(40) NOT NULL,
  description VARCHAR(500),
  created_by INTEGER NOT NULL REFERENCES users(id)
);

CREATE TABLE workout_template (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  alias VARCHAR(40) NOT NULL,
  description VARCHAR(500)
);

CREATE TABLE users_workouts (
  user_id INTEGER REFERENCES users(id),
  workout_id INTEGER REFERENCES workouts(id),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  PRIMARY KEY (user_id, workout_id, start_date)
);

CREATE TABLE exercises (
  id SERIAL PRIMARY KEY,
  alias VARCHAR(40) NOT NULL,
  description VARCHAR(500)
);

CREATE TABLE users_exercises (
  user_id INTEGER REFERENCES users(id),
  exercise_id INTEGER REFERENCES exercises(id),
  PRIMARY KEY (user_id, exercise_id)
);

CREATE TABLE workout_template_exercises (
  workout_template_id INTEGER REFERENCES workout_template(id),
  exercise_id INTEGER REFERENCES exercises(id),
  exercise_order INTEGER NOT NULL,
  exercise_sets INTEGER NOT NULL,
  PRIMARY KEY (workout_template_id, exercise_id, exercise_order)
);

CREATE TABLE workouts_exercises (
  workout_id INTEGER REFERENCES workouts(id),
  exercise_id INTEGER REFERENCES exercises(id),
  exercise_set INTEGER NOT NULL,
  exercise_reps INTEGER,
  exercise_weight REAL,
  exercise_time_in_seconds INTEGER,
  PRIMARY KEY (workout_id, exercise_id, exercise_set)
);
