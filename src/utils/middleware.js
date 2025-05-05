const dbUsers = require("../db/users");
const dbExercises = require("../db/exercises");
const dbWorkouts = require("../db/workouts");
const dbWorkoutsTemplates = require("../db/workoutsTemplates");
const dbSubscriptions = require("../db/subscriptions");
const utils = require("./utils");
const { validationResult } = require("express-validator");
const hash = require("../hashing");

const authenticatedUser = (req, res, next) => {
  try {
    const user = req.session.passport.user;
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Not logged in." });
  }
};

const loggedUserIdEqualsUserIdInRequest = (req, res, next) => {
  const loggedUser = req.session.passport.user;
  const loggedUserId = loggedUser.id;

  const userIdInRequest = req.params.userId
    ? req.params.userId
    : req.body.userId;

  if (
    loggedUserId === userIdInRequest &&
    loggedUserId !== undefined &&
    loggedUserId !== null
  ) {
    next();
  } else {
    return res.status(403).json({ msg: "Not authorized" });
  }
};

const exerciseBelongsToLoggedInUser = async (req, res, next) => {
  const loggedUser = req.session.passport.user;
  const loggedUserId = loggedUser.id;

  const exerciseId = req.params.exerciseId
    ? req.params.exerciseId
    : req.body.exerciseId;

  const exerciseBelongsToUser = await dbExercises.exerciseBelongsToUser(
    exerciseId,
    loggedUserId
  );

  if (exerciseBelongsToUser) {
    next();
  } else {
    return res.status(403).json({ msg: "Not authorized" });
  }
};

const exerciseBelongsToLoggedInORCommonUser = async (req, res, next) => {
  const loggedUser = req.session.passport.user;
  const loggedUserId = loggedUser.id;
  const exerciseId = req.params.exerciseId
    ? req.params.exerciseId
    : req.body.exerciseId;
  const exerciseBelongsToUser = await dbExercises.exerciseBelongsToUser(
    exerciseId,
    loggedUserId
  );
  if (exerciseBelongsToUser) {
    return next();
  }
  // Two steps to avoid unnecessary queries to the database if the logged in user owns the exercise
  const commonUser = await dbUsers.selectUserByEmail(
    process.env.DB_COMMON_USER_EMAIL
  );
  const commonUserId = commonUser.id;
  const exerciseBelongsToCommonUser = await dbExercises.exerciseBelongsToUser(
    exerciseId,
    commonUserId
  );
  if (exerciseBelongsToCommonUser) {
    return next();
  }
  return res.status(403).json({ msg: "Not authorized" });
};

const workoutBelongsToLoggedInUser = async (req, res, next) => {
  const loggedUser = req.session.passport.user;
  const loggedUserId = loggedUser.id;

  const workoutId = req.params.workoutId
    ? req.params.workoutId
    : req.body.workoutId;

  let workoutBelongsToUser;

  try {
    workoutBelongsToUser = await dbWorkouts.workoutBelongsToUser(
      workoutId,
      loggedUserId
    );
  } catch (error) {
    console.log(error);
  }

  if (workoutBelongsToUser) {
    next();
  } else {
    return res.status(403).json({ msg: "Not authorized" });
  }
};

const workoutTemplateBelongsToLoggedInUser = async (req, res, next) => {
  const loggedUser = req.session.passport.user;
  const loggedUserId = loggedUser.id;

  const templateId = req.params.templateId
    ? req.params.templateId
    : req.body.templateId;

  const workoutTemplateBelongsToUser =
    await dbWorkoutsTemplates.workoutTemplateBelongsToUser(
      templateId,
      loggedUserId
    );

  if (workoutTemplateBelongsToUser) {
    next();
  } else {
    return res.status(403).json({ msg: "Not authorized" });
  }
};

const workoutTemplateBelongsToLoggedInORCommonUser = async (req, res, next) => {
  const loggedUser = req.session.passport.user;
  const loggedUserId = loggedUser.id;

  const templateId = req.params.templateId
    ? req.params.templateId
    : req.body.templateId;

  const workoutTemplateBelongsToUser =
    await dbWorkoutsTemplates.workoutTemplateBelongsToUser(
      templateId,
      loggedUserId
    );

  if (workoutTemplateBelongsToUser) {
    return next();
  }

  // Two steps to avoid unnecessary queries to the database if the logged in user owns the template
  const commonUser = await dbUsers.selectUserByEmail(
    process.env.DB_COMMON_USER_EMAIL
  );
  const commonUserId = commonUser.id;

  const workoutTemplateBelongsToCommonUser =
    await dbWorkoutsTemplates.workoutTemplateBelongsToUser(
      templateId,
      commonUserId
    );

  if (workoutTemplateBelongsToCommonUser) {
    return next();
  }

  return res.status(403).json({ msg: "Not authorized" });
};

// This function is an example of how authorization can be implemented.
// I have not tested it because I think I need a browser GUI to keep a session active
// and just Postman is not enough. After posting to /login, it probably doesn't keep
// a session active due to no being a browser.
// Probably, something like this can also be used for authenticated users
const authorizedUser = (req, res, next) => {
  // Check for the authorized property within the session
  if (req.session.authorized) {
    // next middleware function is invoked
    res.next();
  } else {
    res.status(403).json({ msg: "You're not authorized to view this page" });
  }
};

const processIntegerURLParameter = (category) => {
  // Category is just a string appended to the id at the end of the middleware.
  // Its purpose is to differentiate different ids processed in the same
  // response cycle.

  return (req, res, next, id) => {
    let intId;
    try {
      intId = parseInt(id);
    } catch (error) {
      console.log(error);
      return res.status(400).json({ msg: "Invalid id" });
    }

    if (Number.isNaN(intId)) {
      return res.status(400).json({ msg: "Invalid id" });
    }

    req[`${category}Id`] = intId;
    next();
  };
};

const validateResult = (errorCodeToSend) => {
  return (req, res, next) => {
    // DOCS: Source https://www.youtube.com/watch?v=VMRgFfmv6j0
    const result = validationResult(req);

    // This means that there were no errors
    if (result.isEmpty()) {
      return next();
    }

    res.status(errorCodeToSend).json({ errors: result.array() });
  };
};

const checkKeysInBodyRequest = (mandatoryBodyParametersArray) => {
  // Middleware used for compliying with API spec. It checks that all required parameters
  // are included in the body request
  return (req, res, next) => {
    const parametersAreIncluded = utils.checkKeysInObject(
      mandatoryBodyParametersArray,
      req.body
    );

    if (parametersAreIncluded) return next();

    const msg = `At least one of this parameters is missing: ${mandatoryBodyParametersArray.join(
      ", "
    )}`;

    res.status(400).json({
      msg,
    });
  };
};

const checkUserEmailAndAliasAlreadyExist = async (req, res, next) => {
  // IMPORTANT: This middleware must be called after validating user parameter
  const { username, email } = req.body;

  const emailInUse = (await dbUsers.checkEmailInUse(email)) === true;

  if (emailInUse) {
    return res.status(409).json({
      msg: "Email already in use",
    });
  }

  if ((await dbUsers.checkAliasInUse(username)) === true) {
    return res.status(409).json({
      msg: "Alias already in use",
    });
  }

  next();
};

const checkUserExistsById = async (req, res, next) => {
  // IMPORTANT: This middleware must be called after validating userId parameter
  const userId = req.params.userId
    ? req.params.userId
    : req.body.userId
    ? req.body.userId
    : req.session.passport.user.id;

  const user = await dbUsers.selectUserById(userId);

  if (!user) {
    return res.status(404).json({
      msg: "User not found",
    });
  }

  next();
};

const checkExerciseExistsById = async (req, res, next) => {
  // IMPORTANT: This middleware must be called after validating exerciseId parameter
  const exerciseId = req.params.exerciseId
    ? req.params.exerciseId
    : req.body.exerciseId;

  const exercise = await dbExercises.selectExerciseById(exerciseId);

  if (!exercise) {
    return res.status(404).json({
      msg: "Exercise not found",
    });
  }

  next();
};

const checkWorkoutExistsById = async (req, res, next) => {
  // IMPORTANT: This middleware must be called after validating workoutId parameter
  const workoutId = req.params.workoutId
    ? req.params.workoutId
    : req.body.workoutId;

  const workout = await dbWorkouts.selectworkoutById(workoutId);

  if (!workout) {
    return res.status(404).json({
      msg: "Workout not found",
    });
  }

  next();
};

const checkSubscriptionExistsById = async (req, res, next) => {
  // IMPORTANT: This middleware must be called after validating subscriptionId parameter
  const subscriptionId = req.params.subscriptionId
    ? req.params.subscriptionId
    : req.body.subscriptionId;
  const subscription = await dbSubscriptions.selectSuscriptionById(
    subscriptionId
  );
  if (!subscription) {
    return res.status(404).json({
      msg: "Subscription not found",
    });
  }
  next();
};

const checkExerciseSetExistsInWorkout = async (req, res, next) => {
  // IMPORTANT: This middleware must be called after validating workoutId parameter
  const workoutId = req.params.workoutId
    ? req.params.workoutId
    : req.body.workoutId;
  const exerciseId = req.params.exerciseId
    ? req.params.exerciseId
    : req.body.exerciseId;
  const exerciseSet = req.params.exerciseSet
    ? req.params.exerciseSet
    : req.body.exerciseSet;

  const workout = await dbWorkouts.selectworkoutById(workoutId);
  const exercises = workout.exercises;

  const setExists =
    exercises.filter((ex) => {
      return ex.set === exerciseSet && ex.id === exerciseId;
    }).length > 0;

  if (!setExists) {
    return res.status(404).json({
      msg: `Exercise with id ${exerciseId} does not contain set ${exerciseSet}`,
    });
  }

  next();
};

const checkWorkoutTemplateExistsById = async (req, res, next) => {
  // IMPORTANT: This middleware must be called after validating templateId parameter
  const templateId = req.params.templateId
    ? req.params.templateId
    : req.body.templateId;

  const template = await dbWorkoutsTemplates.selectWorkoutTemplateById(
    templateId
  );

  if (!template) {
    return res.status(404).json({
      msg: "Template not found",
    });
  }

  next();
};

const checkExerciseOrderExistsInWorkoutTemplate = async (req, res, next) => {
  // IMPORTANT: This middleware must be called after validating workoutId parameter
  const templateId = req.params.templateId
    ? req.params.templateId
    : req.body.templateId;
  const exerciseId = req.params.exerciseId
    ? req.params.exerciseId
    : req.body.exerciseId;
  const exerciseOrder = req.params.exerciseOrder
    ? req.params.exerciseOrder
    : req.body.exerciseOrder;

  const exerciseInWorkoutTemplateExists =
    await dbWorkoutsTemplates.checkExerciseInWorkoutTemplateExists(
      templateId,
      exerciseId,
      exerciseOrder
    );

  if (!exerciseInWorkoutTemplateExists) {
    return res.status(404).json({
      msg: `Exercise with id ${exerciseId} does not exist in workout template with id ${templateId} in the order ${exerciseOrder}`,
    });
  }

  next();
};

const hashPassword = async (req, res, next) => {
  // IMPORTANT use this middleware after validating password
  const { password } = req.body;

  if (password) {
    const hashedPassword = await hash.plainTextHash(password);
    req.body.password = hashedPassword;
  }

  next();
};

module.exports = {
  processIntegerURLParameter,
  authenticatedUser,
  loggedUserIdEqualsUserIdInRequest,
  exerciseBelongsToLoggedInUser,
  exerciseBelongsToLoggedInORCommonUser,
  workoutBelongsToLoggedInUser,
  workoutTemplateBelongsToLoggedInUser,
  workoutTemplateBelongsToLoggedInORCommonUser,
  checkKeysInBodyRequest,
  validateResult,
  checkUserEmailAndAliasAlreadyExist,
  checkUserExistsById,
  checkExerciseExistsById,
  checkWorkoutExistsById,
  checkSubscriptionExistsById,
  checkExerciseSetExistsInWorkout,
  checkExerciseOrderExistsInWorkoutTemplate,
  checkWorkoutTemplateExistsById,
  hashPassword,
};
