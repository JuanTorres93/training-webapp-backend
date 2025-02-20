const dbWorkoutsTemplates = require('../db/workoutsTemplates');

////////////////////
// READ OPERATIONS
exports.getAllTemplates = async (req, res, next) => {
  const templates = await dbWorkoutsTemplates.selectAllWorkoutsTemplates();

  res.status(200).send(templates);
}

exports.getCommonTemplates = async (req, res, next) => {
  const commonTemplates = await dbWorkoutsTemplates.selectCommonWorkoutTemplates();
  res.status(200).json(commonTemplates);
};

exports.getTemplateById = async (req, res, next) => {
  const { templateId } = req.params;

  const workoutTemplate = await dbWorkoutsTemplates.selectWorkoutTemplateById(templateId);

  res.status(200).json(workoutTemplate);
};

exports.getAllTemplatesFromUser = async (req, res, next) => {
  const { userId } = req.params;
  const templates = await dbWorkoutsTemplates.selectWorkoutTemplatesByUserId(userId);
  res.status(200).json(templates);
};

exports.getLastTemplatesPerformedAndFinishedByUser = async (req, res, next) => {
  const { userId, numberOfWorkouts } = req.params;

  const templates = await dbWorkoutsTemplates.selectIdDateAndNameFromLastPerformedTemplatesByUser(userId, numberOfWorkouts);
  res.status(200).json(templates);
};

////////////////////
// CREATE OPERATIONS

exports.createTemplate = async (req, res, next) => {
  try {
    const createdWorkoutTemplate = await dbWorkoutsTemplates.createWorkoutTemplate(
      req.body
    );
    return res.status(201).json(createdWorkoutTemplate);
  } catch (error) {
    return res.status(400).json({
      msg: "Error when creating workout"
    });
  }
};

////////////////////
// UPDATE OPERATIONS

exports.updateTemplate = async (req, res, next) => {
  const { templateId } = req.params;
  const { name, description } = req.body;

  const updateWorkoutTemplateInfo = {
    name,
    description,
  };

  const updatedWorkoutTemplate = await dbWorkoutsTemplates.updateWorkoutTemplate(
    templateId, updateWorkoutTemplateInfo
  );

  res.status(200).json(updatedWorkoutTemplate);
};

exports.updateExerciseInTemplate = async (req, res, next) => {
  const { templateId, exerciseId, exerciseOrder } = req.params;
  const { newExerciseOrder, exerciseSets } = req.body;

  const updateExerciseInfo = {
    exerciseId,
    newExerciseOrder,
    exerciseSets,
  };

  const updatedExercise = await dbWorkoutsTemplates.updateExerciseFromWorkoutTemplate(
    templateId, exerciseOrder, updateExerciseInfo
  );

  res.status(200).json(updatedExercise);
};

exports.addExerciseToTemplate = async (req, res, next) => {
  const { templateId } = req.params;

  const exercise = {
    ...req.body,
    workoutTemplateId: templateId,
  };

  try {
    const addedExercise = await dbWorkoutsTemplates.addExerciseToWorkoutTemplate(exercise);

    return res.status(201).json(addedExercise);
  } catch (error) {
    return res.status(400).json({
      msg: "Error when adding exercise to workout template"
    });
  }
};

////////////////////
// DELETE OPERATIONS

exports.deleteTemplate = async (req, res, next) => {
  const { templateId } = req.params;

  const deletedWorkoutTemplate = await dbWorkoutsTemplates.deleteWorkoutTemplate(
    templateId
  );

  res.status(200).json(deletedWorkoutTemplate);

};

exports.deleteExerciseFromTemplate = async (req, res, next) => {
  const { templateId, exerciseId, exerciseOrder } = req.params;

  const deletedExercise = await dbWorkoutsTemplates.deleteExerciseFromWorkoutTemplate(
    templateId, exerciseId, exerciseOrder
  );

  res.status(200).json(deletedExercise[0]);
};

exports.truncateTestTable = async (req, res, next) => {
  const truncatedTable = await dbWorkoutsTemplates.truncateTableTest();

  res.status(200).send(truncatedTable);
};