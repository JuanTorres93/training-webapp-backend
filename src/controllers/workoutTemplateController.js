const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const dbWorkoutsTemplates = require("../db/workoutsTemplates");

////////////////////
// READ OPERATIONS
exports.getAllTemplates = catchAsync(async (req, res, next) => {
  const templates = await dbWorkoutsTemplates.selectAllWorkoutsTemplates();

  res.status(200).send(templates);
});

exports.getCommonTemplates = catchAsync(async (req, res, next) => {
  const commonTemplates =
    await dbWorkoutsTemplates.selectCommonWorkoutTemplates();
  res.status(200).json(commonTemplates);
});

exports.getTemplateById = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;

  const workoutTemplate = await dbWorkoutsTemplates.selectWorkoutTemplateById(
    templateId
  );

  res.status(200).json(workoutTemplate);
});

exports.getAllTemplatesFromUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const templates = await dbWorkoutsTemplates.selectWorkoutTemplatesByUserId(
    userId
  );
  res.status(200).json(templates);
});

exports.getLastTemplatesPerformedAndFinishedByUser = catchAsync(
  async (req, res, next) => {
    const { userId, numberOfWorkouts } = req.params;

    const templates =
      await dbWorkoutsTemplates.selectIdDateAndNameFromLastPerformedTemplatesByUser(
        userId,
        numberOfWorkouts
      );
    res.status(200).json(templates);
  }
);

////////////////////
// CREATE OPERATIONS

exports.createTemplate = catchAsync(async (req, res, next) => {
  const createdWorkoutTemplate =
    await dbWorkoutsTemplates.createWorkoutTemplate(req.body);
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
