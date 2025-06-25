const AppError = require("../utils/appError");
const utils = require("./utils");
const { validationResult } = require("express-validator");
const hash = require("../hashing");
const {
  User,
  Exercise,
  Workout,
  Subscription,
  UserWorkouts,
  WorkoutTemplate,
  WorkoutTemplateExercises,
} = require("../models");

const _exerciseBelongsToUser = async (exerciseId, userId) => {
  const exercise = await Exercise.findOne({
    where: {
      id: exerciseId,
    },
  });

  const user = await User.findOne({
    where: {
      id: userId,
    },
  });

  const exerciseBelongsToUser = await user.hasExercise(exercise);

  return exerciseBelongsToUser;
};

const authenticatedUser = (req, res, next) => {
  try {
    const user = req.session.passport.user;
    next();
  } catch (error) {
    return next(
      new AppError("You must be logged in to access this resource.", 401)
    );
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
    return next(
      new AppError("You are not authorized to access this resource.", 403)
    );
  }
};

const exerciseBelongsToLoggedInUser = async (req, res, next) => {
  const loggedUser = req.session.passport.user;
  const loggedUserId = loggedUser.id;

  const exerciseId = req.params.exerciseId
    ? req.params.exerciseId
    : req.body.exerciseId;

  const exerciseBelongsToUser = await _exerciseBelongsToUser(
    exerciseId,
    loggedUserId
  );

  if (exerciseBelongsToUser) {
    next();
  } else {
    return next(
      new AppError("You are not authorized to access this resource.", 403)
    );
  }
};

const exerciseBelongsToLoggedInORCommonUser = async (req, res, next) => {
  const loggedUser = req.session.passport.user;
  const loggedUserId = loggedUser.id;
  const exerciseId = req.params.exerciseId
    ? req.params.exerciseId
    : req.body.exerciseId;

  const exerciseBelongsToUser = await _exerciseBelongsToUser(
    exerciseId,
    loggedUserId
  );

  if (exerciseBelongsToUser) {
    return next();
  }

  // Two steps to avoid unnecessary queries to the database if the logged in user owns the exercise
  const commonUser = await User.findOne({
    where: {
      email: process.env.DB_COMMON_USER_EMAIL,
    },
  });
  const commonUserId = commonUser.id;
  const exerciseBelongsToCommonUser = await _exerciseBelongsToUser(
    exerciseId,
    commonUserId
  );
  if (exerciseBelongsToCommonUser) {
    return next();
  }

  return next(
    new AppError("You are not authorized to access this resource.", 403)
  );
};

const workoutBelongsToLoggedInUser = async (req, res, next) => {
  const loggedUser = req.session.passport.user;
  const loggedUserId = loggedUser.id;

  const workoutId = req.params.workoutId
    ? req.params.workoutId
    : req.body.workoutId;

  let workoutBelongsToUser;

  try {
    workoutBelongsToUser = await UserWorkouts.findOne({
      where: {
        user_id: loggedUserId,
        workout_id: workoutId,
      },
    });
  } catch (error) {
    console.log(error);
  }

  if (workoutBelongsToUser) {
    next();
  } else {
    return next(
      new AppError("You are not authorized to access this resource.", 403)
    );
  }
};

const workoutTemplateBelongsToLoggedInUser = async (req, res, next) => {
  const loggedUser = req.session.passport.user;
  const loggedUserId = loggedUser.id;

  const templateId = req.params.templateId
    ? req.params.templateId
    : req.body.templateId;

  const workoutTemplateBelongsToUser = await WorkoutTemplate.findOne({
    where: {
      user_id: loggedUserId,
      id: templateId,
    },
  });

  if (workoutTemplateBelongsToUser) {
    next();
  } else {
    return next(
      new AppError("You are not authorized to access this resource.", 403)
    );
  }
};

const workoutTemplateBelongsToLoggedInORCommonUser = async (req, res, next) => {
  const loggedUser = req.session.passport.user;
  const loggedUserId = loggedUser.id;

  const templateId = req.params.templateId
    ? req.params.templateId
    : req.body.templateId
    ? req.body.templateId
    : req.body.template_id;

  const workoutTemplateBelongsToUser = await WorkoutTemplate.findOne({
    where: {
      user_id: loggedUserId,
      id: templateId,
    },
  });

  if (workoutTemplateBelongsToUser) {
    return next();
  }

  // Two steps to avoid unnecessary queries to the database if the logged in user owns the template
  const commonUser = await User.findOne({
    where: {
      email: process.env.DB_COMMON_USER_EMAIL,
    },
  });
  const commonUserId = commonUser.id;

  const workoutTemplateBelongsToCommonUser = await WorkoutTemplate.findOne({
    where: {
      user_id: commonUserId,
      id: templateId,
    },
  });

  if (workoutTemplateBelongsToCommonUser) {
    return next();
  }

  return next(
    new AppError("You are not authorized to access this resource.", 403)
  );
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
      return next(new AppError("Invalid id", 400));
    }

    if (Number.isNaN(intId)) {
      return next(new AppError("Invalid id", 400));
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

  // TODO Refactor these two to use AppError. Do it when testing front too. I think
  // I used the msg property in the response to show the error
  if (await User.checkEmailInUse(email)) {
    return res.status(409).json({
      msg: "Email already in use",
    });
  }

  if ((await User.checkUsernameInUse(username)) === true) {
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

  const user = await User.findOne({
    where: {
      id: userId,
    },
  });

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  next();
};

const checkExerciseExistsById = async (req, res, next) => {
  // IMPORTANT: This middleware must be called after validating exerciseId parameter
  const exerciseId = req.params.exerciseId
    ? req.params.exerciseId
    : req.body.exerciseId;

  const exercise = await Exercise.findOne({
    where: {
      id: exerciseId,
    },
  });

  if (!exercise) {
    return next(new AppError("Exercise not found", 404));
  }

  next();
};

const checkWorkoutExistsById = async (req, res, next) => {
  // IMPORTANT: This middleware must be called after validating workoutId parameter
  const workoutId = req.params.workoutId
    ? req.params.workoutId
    : req.body.workoutId;

  const workout = await Workout.findOne({
    where: {
      id: workoutId,
    },
  });

  if (!workout) {
    return next(new AppError("Workout not found", 404));
  }

  next();
};

const checkSubscriptionExistsById = async (req, res, next) => {
  // IMPORTANT: This middleware must be called after validating subscriptionId parameter
  const subscriptionId = req.params.subscriptionId
    ? req.params.subscriptionId
    : req.body.subscriptionId;

  const subscription = await Subscription.findOne({
    where: {
      id: subscriptionId,
    },
  });

  if (!subscription) {
    return next(new AppError("Subscription not found", 404));
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

  const workout = await Workout.getWorkoutByIdSpec(workoutId);
  const exercises = workout.exercises;

  const setExists =
    exercises.filter((ex) => {
      return ex.set === exerciseSet && ex.id === exerciseId;
    }).length > 0;

  if (!setExists) {
    return next(
      new AppError(
        `Exercise with id ${exerciseId} does not contain set ${exerciseSet}`,
        404
      )
    );
  }

  next();
};

const checkWorkoutTemplateExistsById = async (req, res, next) => {
  // IMPORTANT: This middleware must be called after validating templateId parameter
  const templateId = req.params.templateId
    ? req.params.templateId
    : req.body.templateId
    ? req.body.templateId
    : req.body.template_id;

  const template = await WorkoutTemplate.findOne({
    where: {
      id: templateId,
    },
  });

  if (!template) {
    return next(new AppError("Template not found", 404));
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
    await WorkoutTemplateExercises.findOne({
      where: {
        workout_template_id: templateId,
        exercise_id: exerciseId,
        exercise_order: exerciseOrder,
      },
    });

  if (!exerciseInWorkoutTemplateExists) {
    return next(
      new AppError(
        `Exercise with id ${exerciseId} does not exist in workout template with id ${templateId} in the order ${exerciseOrder}`,
        404
      )
    );
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

const passwordEqualsPasswordConfirm = (req, res, next) => {
  const { password, passwordConfirm } = req.body;

  if (password !== passwordConfirm) {
    return next(
      new AppError("Password and password confirm do not match", 400)
    );
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
  passwordEqualsPasswordConfirm,
};
