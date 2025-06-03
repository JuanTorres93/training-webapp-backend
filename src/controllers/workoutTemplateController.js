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
const e = require("express");

////////////////////
// READ OPERATIONS
exports.getAllTemplates = catchAsync(async (req, res, next) => {
  // TODO TEST
  const templates = await dbWorkoutsTemplates.selectAllWorkoutsTemplates();

  res.status(200).send(templates);
});

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

exports.getTemplateById = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;

  //const workoutTemplate = await _getTemplateAsSpecHardModificationSequelize(
  //  templateId
  //);

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

  const updatedWorkoutTemplate =
    await dbWorkoutsTemplates.updateWorkoutTemplate(
      templateId,
      updateWorkoutTemplateInfo
    );

  res.status(200).json(updatedWorkoutTemplate);
});

exports.updateExerciseInTemplate = catchAsync(async (req, res, next) => {
  const { templateId, exerciseId, exerciseOrder } = req.params;
  const { newExerciseOrder, exerciseSets } = req.body;

  const updateExerciseInfo = {
    exerciseId,
    newExerciseOrder,
    exerciseSets,
  };

  const updatedExercise =
    await dbWorkoutsTemplates.updateExerciseFromWorkoutTemplate(
      templateId,
      exerciseOrder,
      updateExerciseInfo
    );

  res.status(200).json(updatedExercise);
});

exports.addExerciseToTemplate = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;

  const exercise = {
    ...req.body,
    workoutTemplateId: templateId,
  };

  const addedExercise = await dbWorkoutsTemplates.addExerciseToWorkoutTemplate(
    exercise
  );

  return res.status(201).json(addedExercise);
});

////////////////////
// DELETE OPERATIONS

exports.deleteTemplate = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;

  const deletedWorkoutTemplate =
    await dbWorkoutsTemplates.deleteWorkoutTemplate(templateId);

  res.status(200).json(deletedWorkoutTemplate);
});

exports.deleteExerciseFromTemplate = catchAsync(async (req, res, next) => {
  const { templateId, exerciseId, exerciseOrder } = req.params;

  const deletedExercise =
    await dbWorkoutsTemplates.deleteExerciseFromWorkoutTemplate(
      templateId,
      exerciseId,
      exerciseOrder
    );

  res.status(200).json(deletedExercise[0]);
});

exports.truncateTestTable = catchAsync(async (req, res, next) => {
  const truncatedTable = await dbWorkoutsTemplates.truncateTableTest();

  res.status(200).send(truncatedTable);
});
