const { Op } = require("sequelize");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const {
  sequelize,
  Workout,
  WorkoutExercises,
  User,
  UserWorkouts,
  WorkoutTemplate,
} = require("../models");

// TODO Move this function to the model
const _selectLastWorkoutsIdsInCronologicalOrder = async (
  templateId,
  userId,
  numberOfWorkouts
) => {
  const commonUser = await User.findOne({
    where: { email: process.env.DB_COMMON_USER_EMAIL },
  });

  const findFunction =
    numberOfWorkouts === 1
      ? (...args) => UserWorkouts.findOne(...args)
      : (...args) => UserWorkouts.findAll(...args);

  const findOptions = {
    attributes: [["workout_id", "workout_id"]],
    where: {
      user_id: { [Op.in]: [userId, commonUser.id] },
    },
    include: [
      {
        model: Workout,
        where: { template_id: templateId },
        include: [{ model: WorkoutTemplate, as: "workoutTemplate" }],
      },
    ],
    order: [["start_date", "DESC"]],
  };

  if (numberOfWorkouts > 1) {
    findOptions.limit = numberOfWorkouts;
  }

  const workoutIds = await findFunction(findOptions);

  return workoutIds;
};

//////////////////////
// READ OPERATIONS

exports.getWorkoutById = catchAsync(async (req, res, next) => {
  const { workoutId } = req.params;

  processedWorkout = await Workout.getWorkoutByIdSpec(workoutId);

  res.status(200).json(processedWorkout);
});

exports.getLastWorkoutsFromATemplateByUserId = catchAsync(
  async (req, res, next) => {
    const { templateId, userId } = req.params;

    const numberOfWorkouts =
      parseInt(req.params.numberOfWorkouts) > 10
        ? 10
        : parseInt(req.params.numberOfWorkouts);

    const workoutsIds = await _selectLastWorkoutsIdsInCronologicalOrder(
      templateId,
      userId,
      numberOfWorkouts
    );

    let idsArray = workoutsIds;

    if (!Array.isArray(workoutsIds)) {
      idsArray = [workoutsIds];
    }

    const workoutsPromises = idsArray.map((workoutInfo) =>
      Workout.getWorkoutByIdSpec(workoutInfo.workout_id)
    );

    const workouts = await Promise.all(workoutsPromises);

    res.status(200).json(workouts);
  }
);

exports.getLastSingleWorkoutFromTemplateByUserId = catchAsync(
  async (req, res, next) => {
    const { templateId, userId } = req.params;

    const workoutId = await _selectLastWorkoutsIdsInCronologicalOrder(
      templateId,
      userId,
      1
    );

    const workout = await Workout.getWorkoutByIdSpec(workoutId.workout_id);

    res.status(200).json(workout);
  }
);

exports.getAllWorkoutsFromTemplate = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;

  const user = req.session.passport.user;
  const commonUser = await User.findOne({
    where: { email: process.env.DB_COMMON_USER_EMAIL },
  });

  const workoutsIds = await Workout.findAll({
    where: { template_id: templateId },
    attributes: [["id", "workout_id"]],
    include: [
      {
        model: WorkoutTemplate,
        as: "workoutTemplate",
      },
      {
        model: User,
        as: "users",
        where: {
          id: {
            [Op.or]: [user.id, commonUser.id],
          },
        },
      },
    ],
  });

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

  const q = `UPDATE users_workouts 
             SET 
             end_date = NOW() AT TIME ZONE 'UTC' 
             WHERE workout_id = :workoutId;`;

  const processedWorkout = await Workout.getWorkoutByIdSpec(workoutId);

  res.status(200).json(processedWorkout);
});

exports.updateWorkout = catchAsync(async (req, res, next) => {
  const { workoutId } = req.params;
  const { description } = req.body;

  // Update workout
  await Workout.update(
    { description },
    {
      where: { id: workoutId },
    }
  );

  const processedWorkout = await Workout.getWorkoutByIdSpec(workoutId);

  res.status(200).json(processedWorkout);
});

exports.updateExerciseInWorkout = catchAsync(async (req, res, next) => {
  const { workoutId, exerciseId } = req.params;
  const { exerciseSet, reps, weight, time_in_seconds } = req.body;

  // exerciseSet is required and must be a positive integer
  if (!exerciseSet || !Number.isInteger(exerciseSet * 1) || exerciseSet < 1) {
    return next(new AppError("Exercise set must be a positive integer", 400));
  }

  // If reps is present and is NOT positive integer
  if (reps && (!Number.isInteger(reps * 1) || reps < 0)) {
    return next(new AppError("Reps must be an integer", 400));
  }

  // If weight is present and is NOT positive number
  if (weight && (!Number.isFinite(weight * 1) || weight < 0)) {
    return next(new AppError("Weight must be a positive number", 400));
  }

  const exerciseInWorkout = await WorkoutExercises.findOne({
    where: {
      workout_id: workoutId,
      exercise_id: exerciseId,
    },
  });

  if (!exerciseInWorkout) {
    return next(
      new AppError(
        `Exercise with id ${exerciseId} does not exist in workout with id ${workoutId}`,
        404
      )
    );
  }

  const updatedExercise = await exerciseInWorkout.update({
    exercise_set: exerciseSet,
    exercise_reps: reps,
    exercise_weight: weight,
    exercise_time_in_seconds: time_in_seconds,
  });

  const exerciseSpec = {
    exerciseId: updatedExercise.exercise_id,
    exerciseSet: updatedExercise.exercise_set,
    reps: parseInt(updatedExercise.exercise_reps),
    weight: parseInt(updatedExercise.exercise_weight),
    time_in_seconds: parseInt(updatedExercise.exercise_time_in_seconds),
  };

  res.status(200).json(exerciseSpec);
});

exports.addExerciseToWorkout = catchAsync(async (req, res, next) => {
  // TODO EFFICIENCY: Make the body an array of exercises to add multiple at once.
  // This will reduce the number of requests to the database and to the server.

  const { workoutId } = req.params;

  // New implementation using Sequelize associations
  const exerciseInfo = await WorkoutExercises.create({
    workout_id: workoutId,
    exercise_id: req.body.exerciseId,
    exercise_set: req.body.exerciseSet,
    exercise_reps: req.body.reps,
    exercise_weight: req.body.weight,
    exercise_time_in_seconds: req.body.time_in_seconds,
  });

  const exerciseSpec = {
    exerciseId: exerciseInfo.exercise_id,
    exerciseSet: exerciseInfo.exercise_set,
    reps: exerciseInfo.exercise_reps,
    weight: exerciseInfo.exercise_weight,
    time_in_seconds: exerciseInfo.exercise_time_in_seconds,
  };

  return res.status(201).json(exerciseSpec);
});

//////////////////////
// DELETE OPERATIONS

exports.deleteWorkout = catchAsync(async (req, res, next) => {
  const { workoutId } = req.params;

  let deletedWorkout;

  await sequelize.transaction(async (t) => {
    // Get workout info to return to the client
    deletedWorkout = await Workout.getWorkoutByIdSpec(workoutId);

    await UserWorkouts.destroy({
      where: { workout_id: workoutId },
      transaction: t,
    });

    await WorkoutExercises.destroy({
      where: { workout_id: workoutId },
      transaction: t,
    });

    await Workout.destroy({
      where: { id: workoutId },
      transaction: t,
    });
  });

  res.status(200).json(deletedWorkout);
});

exports.deleteExerciseFromWorkout = catchAsync(async (req, res, next) => {
  const { workoutId, exerciseId } = req.params;

  // find exercises to return to the client
  const deletedExercises = await WorkoutExercises.findAll({
    where: {
      workout_id: workoutId,
      exercise_id: exerciseId,
    },
  });

  await WorkoutExercises.destroy({
    where: {
      workout_id: workoutId,
      exercise_id: exerciseId,
    },
  });

  const deletedExercisesSpec = deletedExercises.map((exercise) => ({
    exerciseId: exercise.exercise_id,
    exerciseSet: exercise.exercise_set,
    reps: exercise.exercise_reps,
    weight: exercise.exercise_weight,
    time_in_seconds: exercise.exercise_time_in_seconds,
  }));

  res.status(200).json(deletedExercisesSpec);
});

exports.deleteExerciseSetFromWorkout = catchAsync(async (req, res, next) => {
  const { workoutId, exerciseId, exerciseSet } = req.params;

  const deletedExercise = await WorkoutExercises.findOne({
    where: {
      workout_id: workoutId,
      exercise_id: exerciseId,
      exercise_set: exerciseSet,
    },
  });

  await deletedExercise.destroy();

  const deletedExerciseSpec = {
    exerciseId: deletedExercise.exercise_id,
    exerciseSet: deletedExercise.exercise_set,
    reps: deletedExercise.exercise_reps,
    weight: deletedExercise.exercise_weight,
    time_in_seconds: deletedExercise.exercise_time_in_seconds,
  };

  res.status(200).json(deletedExerciseSpec);
});

exports.truncateTestTable = catchAsync(async (req, res, next) => {
  const appIsBeingTested = process.env.NODE_ENV === "test";

  if (!appIsBeingTested) {
    // Generic response for attackers
    return res.status(200).json({
      status: "success",
      message: "Truncated workouts.",
    });
  }

  await sequelize.query("TRUNCATE TABLE workouts RESTART IDENTITY CASCADE");

  res.status(200).send("Table workouts truncated in test db.");
});
