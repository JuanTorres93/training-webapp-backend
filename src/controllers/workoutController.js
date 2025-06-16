const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const dbWorkouts = require("../db/workouts");
const { sequelize, Workout, User, WorkoutTemplate } = require("../models");

const workoutsWithExercisesQuery =
  "SELECT  " +
  "   wk.id AS workout_id,	" +
  "   wkt.id AS workout_template_id,	" +
  "   wkt.name AS workout_name,	" +
  "   wk.description AS workout_description, 	" +
  "   e.id AS exercise_id, 	" +
  "   e.name AS exercise_name, 	" +
  "   w_e.exercise_set AS exercise_set, 	" +
  "   w_e.exercise_reps AS exercise_reps, 	" +
  "   w_e.exercise_weight AS exercise_weight, 	" +
  "   w_e.exercise_time_in_seconds AS exercise_time_in_seconds 	" +
  "FROM workouts " +
  " AS wk " +
  "LEFT JOIN workout_template as wkt ON wk.template_id = wkt.id   " +
  "LEFT JOIN workouts_exercises AS w_e ON wk.id = w_e.workout_id " +
  "LEFT JOIN exercises AS e ON w_e.exercise_id = e.id " +
  "WHERE TRUE " + // This condition is here for DRYING the code replacing it where necessary
  "ORDER BY workout_id, exercise_id, exercise_set " +
  "; ";

const _compactWorkoutInfo = (workoutInfoDb) => {
  // workoutInfoDb represents all rows in the table modeling a workout
  const firstRow = workoutInfoDb[0];

  const workoutSpec = {
    id: firstRow.workout_id,
    template_id: firstRow.workout_template_id,
    name: firstRow.workout_name,
    description: firstRow.workout_description,
    exercises: [],
  };

  // Add date only if it exists
  if (firstRow.start_date !== undefined) {
    workoutSpec.startDate = firstRow.start_date;
  }

  // Add template_id only if it exists
  if (firstRow.template_id !== undefined) {
    workoutSpec.template_id = firstRow.template_id;
  }

  workoutInfoDb.forEach((row) => {
    const exerciseSet = {
      id: row.exercise_id,
      name: row.exercise_name,
      set: row.exercise_set,
      reps: row.exercise_reps,
      weight: row.exercise_weight,
      time_in_seconds: row.exercise_time_in_seconds,
    };

    // Add exercise_order only if it exists
    if (row.exercise_order !== undefined) {
      exerciseSet.order = row.exercise_order;
    }

    workoutSpec.exercises.push(exerciseSet);
  });

  return workoutSpec;
};

//////////////////////
// READ OPERATIONS

exports.getWorkoutById = catchAsync(async (req, res, next) => {
  const { workoutId } = req.params;

  const q = workoutsWithExercisesQuery.replace(
    "WHERE TRUE",
    "WHERE wk.id = :workoutId"
  );

  const results = await sequelize.query(q, {
    replacements: { workoutId },
  });

  const workout = results[0];

  const processedWorkout = _compactWorkoutInfo(workout);

  res.status(200).json(processedWorkout);
});

exports.getLastWorkoutsFromATemplateByUserId = catchAsync(
  async (req, res, next) => {
    const { templateId, userId, numberOfWorkouts } = req.params;

    const workout = await dbWorkouts.selectLastNWorkoutsFromUser(
      templateId,
      userId,
      numberOfWorkouts
    );

    res.status(200).json(workout);
  }
);

exports.getLastSingleWorkoutFromTemplateByUserId = catchAsync(
  async (req, res, next) => {
    const { templateId, userId } = req.params;
    const workout = await dbWorkouts.selectLastWorkoutFromUser(
      templateId,
      userId
    );

    res.status(200).json(workout);
  }
);

exports.getAllWorkoutsFromTemplate = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;
  const user = req.session.passport.user;

  const workoutsIds = await dbWorkouts.getAllWorkoutsIdsFromTemplateId(
    templateId,
    user.id
  );

  res.status(200).json(workoutsIds);
});

//////////////////////
// CREATE OPERATIONS

exports.createWorkout = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const newWorkout = await Workout.create({
    template_id: req.body.template_id,
    description: req.body.description,
  });

  const user = await User.findByPk(userId);
  await user.addWorkout(newWorkout, {
    through: {
      start_date: new Date(),
    },
  });

  const template = await WorkoutTemplate.findByPk(req.body.template_id);

  return res.status(201).json({
    id: newWorkout.id,
    template_id: template.id,
    name: template.name,
    description: newWorkout.description,
    exercises: [],
  });
});

//////////////////////
// UPDATE OPERATIONS

exports.updateEndDateOfWorkout = catchAsync(async (req, res, next) => {
  const { workoutId } = req.params;

  const workout = await dbWorkouts.addFinishDateToWorkout(workoutId);

  res.status(200).json(workout);
});

exports.updateWorkout = catchAsync(async (req, res, next) => {
  const { workoutId } = req.params;
  const { description } = req.body;

  const updateWorkoutInfo = {
    description,
  };

  const updatedWorkout = await dbWorkouts.updateWorkout(
    workoutId,
    updateWorkoutInfo
  );

  res.status(200).json(updatedWorkout);
});

exports.updateExerciseInWorkout = catchAsync(async (req, res, next) => {
  const { workoutId, exerciseId } = req.params;
  const { exerciseSet, reps, weight, time_in_seconds } = req.body;

  const exerciseInWorkoutExists = await dbWorkouts.checkExerciseInWorkoutExists(
    workoutId,
    exerciseId
  );

  if (!exerciseInWorkoutExists) {
    return next(
      new AppError(
        `Exercise with id ${exerciseId} does not exist in workout with id ${workoutId}`,
        404
      )
    );
  }

  const updateExerciseInfo = {
    exerciseId,
    exerciseSet,
    reps,
    weight,
    time_in_seconds,
  };

  const updatedExercise = await dbWorkouts.updateExerciseFromWorkout(
    workoutId,
    updateExerciseInfo
  );

  res.status(200).json(updatedExercise);
});

exports.addExerciseToWorkout = catchAsync(async (req, res, next) => {
  const { workoutId } = req.params;

  const exerciseData = {
    ...req.body,
    timeInSeconds: req.body.time_in_seconds,
    exerciseId: req.body.exerciseId,
    exerciseSet: req.body.exerciseSet,
    workoutId,
  };

  // TODO CHECK primary key is not duplicated?
  const addedExercise = await dbWorkouts.addExerciseToWorkout(exerciseData);

  const capitalizedAddedExercise = {
    exerciseId: addedExercise.exerciseid,
    exerciseSet: addedExercise.exerciseset,
    reps: addedExercise.reps,
    weight: addedExercise.weight,
    time_in_seconds: addedExercise.time_in_seconds,
  };

  return res.status(201).json(capitalizedAddedExercise);
});

//////////////////////
// DELETE OPERATIONS

exports.deleteWorkout = catchAsync(async (req, res, next) => {
  const { workoutId } = req.params;

  const deletedWorkout = await dbWorkouts.deleteWorkout(workoutId);

  res.status(200).json(deletedWorkout);
});

exports.deleteExerciseFromWorkout = catchAsync(async (req, res, next) => {
  const { workoutId, exerciseId } = req.params;

  const deletedExercise = await dbWorkouts.deleteExerciseFromWorkout(
    workoutId,
    exerciseId
  );

  res.status(200).json(deletedExercise);
});

exports.deleteExerciseSetFromWorkout = catchAsync(async (req, res, next) => {
  const { workoutId, exerciseId, exerciseSet } = req.params;

  const deletedExercise = await dbWorkouts.deleteSetFromExercise(
    workoutId,
    exerciseId,
    exerciseSet
  );

  res.status(200).json(deletedExercise);
});

exports.truncateTestTable = catchAsync(async (req, res, next) => {
  const truncatedTable = await dbWorkouts.truncateTableTest();

  res.status(200).send(truncatedTable);
});
