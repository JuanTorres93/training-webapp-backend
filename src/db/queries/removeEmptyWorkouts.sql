-- First, delete from users_workouts
DELETE FROM users_workouts uw
WHERE uw.workout_id IN (
    SELECT w.id
    FROM workouts w
    JOIN users_workouts uw2 ON uw2.workout_id = w.id
    WHERE uw2.end_date IS NULL
    AND (uw2.start_date AT TIME ZONE 'UTC') <= (NOW() AT TIME ZONE 'UTC') - INTERVAL '1 day'
    AND NOT EXISTS (
        SELECT 1 
        FROM workouts_exercises we
        WHERE we.workout_id = w.id
    )
) RETURNING workout_id;

-- Then, delete from workouts
DELETE FROM workouts w
WHERE w.id = $1;
