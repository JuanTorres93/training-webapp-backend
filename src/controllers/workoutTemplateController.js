const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const dbWorkoutsTemplates = require("../db/workoutsTemplates");

const {
  sequelize,
  WorkoutTemplate,
  Exercise,
  WorkoutTemplateExercises,
  Workout,
  User,
  UserWorkouts,
} = require("../models");

////////////////////
// READ OPERATIONS
exports.getCommonTemplates = catchAsync(async (req, res, next) => {
  // TODO TEST
  const commonTemplates =
    await dbWorkoutsTemplates.selectCommonWorkoutTemplates();

  res.status(200).json(commonTemplates);
});

const _processTemplateToSpec_HardModificationSequelize = (workoutTemplate) => {
  workoutTemplate.exercises.forEach((exercise) => {
    exercise.setDataValue(
      "order",
      exercise.WorkoutTemplateExercises.exercise_order
    );
    exercise.setDataValue(
      "sets",
      exercise.WorkoutTemplateExercises.exercise_sets
    );

    // NOTE IMPORTANT: Access to dataValues is not recommended.
    // However, we need to remove the association data to avoid sending it to the client.
    // I think that, due to the fact that we are sending right away the data to the client,
    // it is not a problem to use it.
    delete exercise.dataValues.WorkoutTemplateExercises;
    delete exercise.dataValues.description;
  });

  return workoutTemplate;
};

const _getTemplateById = async (templateId) => {
  const workoutTemplate = await WorkoutTemplate.findByPk(templateId, {
    include: [
      {
        model: Exercise,
        as: "exercises",
        through: {
          model: WorkoutTemplateExercises,
          attributes: ["exercise_order", "exercise_sets"],
        },
      },
    ],
  });
  if (!workoutTemplate) {
    return next(
      new AppError(`No workout template found with ID ${templateId}`, 404)
    );
  }

  return workoutTemplate;
};

exports.getTemplateById = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;

  const workoutTemplate = await _getTemplateById(templateId);
  const workoutTemplateProcessed =
    _processTemplateToSpec_HardModificationSequelize(workoutTemplate);

  res.status(200).json(workoutTemplateProcessed);
});

exports.getAllTemplatesFromUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  // TODO INCLUIR MÁS PLANTILLAS EN LOS TESTS CUANDO HAGA EL REFACTOR.
  // NO ESTOY SEGURO DE QUE ESTO FUNCIONE BIEN, AUNQUE CREO QUE SÍ.
  const userTemplates = await WorkoutTemplate.findAll({
    where: { user_id: userId },
    include: [
      {
        model: Exercise,
        as: "exercises",
        through: {
          model: WorkoutTemplateExercises,
          attributes: ["exercise_order", "exercise_sets"],
        },
      },
    ],
  });

  const processedTemplates = userTemplates.map(
    _processTemplateToSpec_HardModificationSequelize
  );

  res.status(200).json(processedTemplates);
});

exports.getLastTemplatesPerformedAndFinishedByUser = catchAsync(
  async (req, res, next) => {
    const { userId, numberOfWorkouts } = req.params;

    const commonUser = await User.findOne({
      where: { email: process.env.DB_COMMON_USER_EMAIL },
    });

    const [results, metadata] = await sequelize.query(
      `
        SELECT
          wt.id AS template_id,
          uw.start_date AT TIME ZONE 'UTC' AS workout_date,
          wt.name AS workout_name
        FROM workouts w
        JOIN users_workouts uw ON w.id = uw.workout_id
        JOIN workout_template wt ON w.template_id = wt.id
        WHERE uw.user_id = :userId OR uw.user_id = :commonUserId
        ORDER BY start_date DESC
        LIMIT :limit;
      `,
      {
        replacements: {
          userId: userId,
          commonUserId: commonUser.id,
          limit: numberOfWorkouts,
        },
      }
    );

    res.status(200).json(results);
  }
);

////////////////////
// CREATE OPERATIONS

exports.createTemplate = catchAsync(async (req, res, next) => {
  const newWorkoutTemplate = await WorkoutTemplate.create({
    ...req.body,
    user_id: req.body.userId,
  });

  // This is done to comply with pre-sequelize code.
  const createdWorkoutTemplate = newWorkoutTemplate.toJSON();
  createdWorkoutTemplate.userId = createdWorkoutTemplate.user_id;
  delete createdWorkoutTemplate.user_id;

  return res.status(201).json(createdWorkoutTemplate);
});

////////////////////
// UPDATE OPERATIONS

exports.updateTemplate = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;
  const { name, description } = req.body;

  const updateWorkoutTemplateInfo = {
    name,
    description,
  };

  // NOTE: I'm not using returning the updated template directly
  // because the specification requires to return the full template with its exercises.
  await WorkoutTemplate.update(updateWorkoutTemplateInfo, {
    where: { id: templateId },
  });

  // Get the full updated template with its exercises.
  const fullUpdatedWorkoutTemplate = await _getTemplateById(templateId);

  // Process the template to match the specification.
  const updatedWorkoutTemplateProcessed =
    _processTemplateToSpec_HardModificationSequelize(
      fullUpdatedWorkoutTemplate
    );

  res.status(200).json(updatedWorkoutTemplateProcessed);
});

exports.updateExerciseInTemplate = catchAsync(async (req, res, next) => {
  const { templateId, exerciseId, exerciseOrder } = req.params;
  const { newExerciseOrder, exerciseSets } = req.body;

  const updateExerciseInfoSequelize = {
    exercise_order: newExerciseOrder,
    exercise_sets: exerciseSets,
  };
  const [affectedRows, updatedExercise] = await WorkoutTemplateExercises.update(
    updateExerciseInfoSequelize,
    {
      where: {
        workout_template_id: templateId,
        exercise_id: exerciseId,
        exercise_order: exerciseOrder,
      },
      returning: true, // This will return the updated instance
    }
  );

  // NOTE: This is done to comply with pre-sequelize code.
  const updatedExerciseProcessed = {
    workoutTemplateId: updatedExercise[0].workout_template_id,
    exerciseId: updatedExercise[0].exercise_id,
    exerciseOrder: updatedExercise[0].exercise_order,
    exerciseSets: updatedExercise[0].exercise_sets,
  };

  res.status(200).json(updatedExerciseProcessed);
});

exports.addExerciseToTemplate = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;
  const { exerciseId, exerciseOrder, exerciseSets } = req.body;

  const exerciseToAdd = await Exercise.findByPk(exerciseId);
  if (!exerciseToAdd) {
    return next(new AppError(`Exercise with ID ${exerciseId} not found`, 404));
  }
  const template = await WorkoutTemplate.findByPk(templateId);
  if (!template) {
    return next(new AppError(`Template with ID ${templateId} not found`, 404));
  }
  await template.addExercise(exerciseToAdd, {
    through: {
      exercise_order: exerciseOrder,
      exercise_sets: exerciseSets,
    },
  });

  const result = await WorkoutTemplateExercises.findOne({
    where: {
      workout_template_id: templateId,
      exercise_id: exerciseId,
      exercise_order: exerciseOrder,
    },
  });

  // NOTE: This is done to comply with pre-sequelize code.
  const addedExercise = {
    workoutTemplateId: result.workout_template_id,
    exerciseId: result.exercise_id,
    exerciseOrder: result.exercise_order,
    exerciseSets: result.exercise_sets,
  };

  return res.status(201).json(addedExercise);
});

////////////////////
// DELETE OPERATIONS

exports.deleteTemplate = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;

  // Get template info to return after deletion
  const template = await WorkoutTemplate.findOne({
    where: { id: templateId },
    attributes: { exclude: ["user_id"] },
    include: [
      {
        model: Exercise,
        as: "exercises",
        through: {
          model: WorkoutTemplateExercises,
          attributes: ["exercise_order", "exercise_sets"],
        },
      },
    ],
  });
  if (!template) {
    return next(new AppError(`Template with ID ${templateId} not found`, 404));
  }

  const processedTemplate =
    _processTemplateToSpec_HardModificationSequelize(template);

  // Delete the template
  await sequelize.transaction(async (t) => {
    await Workout.destroy({
      where: { template_id: templateId },
      transaction: t,
    });
    await WorkoutTemplateExercises.destroy({
      where: { workout_template_id: templateId },
      transaction: t,
    });
    await WorkoutTemplate.destroy({
      where: { id: templateId },
      transaction: t,
    });
  });

  res.status(200).json(processedTemplate);
});

exports.deleteExerciseFromTemplate = catchAsync(async (req, res, next) => {
  const { templateId, exerciseId, exerciseOrder } = req.params;

  // Get exercise info to return after deletion
  const exercise = await WorkoutTemplateExercises.findOne({
    where: {
      workout_template_id: templateId,
      exercise_id: exerciseId,
      exercise_order: exerciseOrder,
    },
  });

  if (!exercise) {
    return next(
      new AppError(
        `Exercise with ID ${exerciseId} and order ${exerciseOrder} not found in template ${templateId}`,
        404
      )
    );
  }

  // NOTE: This is done to comply with pre-sequelize code.
  const processedExercise = {
    workoutTemplateId: exercise.workout_template_id,
    exerciseId: exercise.exercise_id,
    exerciseOrder: exercise.exercise_order,
    exerciseSets: exercise.exercise_sets,
  };

  // Delete the exercise from the template
  await WorkoutTemplateExercises.destroy({
    where: {
      workout_template_id: templateId,
      exercise_id: exerciseId,
      exercise_order: exerciseOrder,
    },
  });

  res.status(200).json(processedExercise);
});

exports.truncateTestTable = catchAsync(async (req, res, next) => {
  const appIsBeingTested = process.env.NODE_ENV === "test";

  if (!appIsBeingTested) {
    // Generic response for attackers
    return res.status(200).json({
      status: "success",
      message: "Truncated workouts_templates.",
    });
  }

  await sequelize.transaction(async (t) => {
    await sequelize.query(
      "TRUNCATE TABLE workout_template RESTART IDENTITY CASCADE"
    );
  });

  res
    .status(200)
    .send("Table exercises and workout_template truncated in test db.");
});
