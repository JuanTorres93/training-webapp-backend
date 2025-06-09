exports.loginUser = async (request, userInfo) => {
  await request.post("/login").send({
    username: userInfo.username,
    password: userInfo.password,
  });
};

exports.logoutUser = async (request) => {
  await request.get("/logout");
};

exports.createNewUser = async (request, userInfo) => {
  const newUserResponse = await request.post("/users").send(userInfo);

  return {
    response: newUserResponse,
    user: newUserResponse.body,
    statusCode: newUserResponse.statusCode,
  };
};

exports.createNewExercise = async (request, exerciseInfo) => {
  const newExercisesResponse = await request
    .post("/exercises")
    .send(exerciseInfo);
  const newExercise = newExercisesResponse.body;

  return {
    response: newExercisesResponse,
    exercise: newExercise,
    statusCode: newExercisesResponse.statusCode,
  };
};

exports.createNewEmptyTemplate = async (request, info) => {
  // NOTE: info should contain userId, name, description
  const responseNewTemplate = await request
    .post("/workouts/templates")
    .send(info);

  const newTemplate = responseNewTemplate.body;
  return {
    response: responseNewTemplate,
    template: newTemplate,
    statusCode: responseNewTemplate.statusCode,
  };
};

exports.addExerciseToExistingTemplate = async (
  request,
  templateId,
  exerciseInfo
) => {
  // NOTE: exerciseInfo should contain exerciseId, exerciseOrder, exerciseSets
  const responseAddExerciseToTemplate = await request
    .post(`/workouts/templates/${templateId}`)
    .send(exerciseInfo);
  const newExerciseInTemplate = responseAddExerciseToTemplate.body;

  return {
    response: responseAddExerciseToTemplate,
    exerciseInTemplate: newExerciseInTemplate,
    statusCode: responseAddExerciseToTemplate.statusCode,
  };
};

exports.createNewWorkout = async (request, workoutInfo) => {
  // NOTE: workoutInfo should contain template_id, description
  const workoutResponse = await request.post("/workouts").send({
    template_id: workoutInfo.template_id,
    description: workoutInfo.description,
  });
  const newWorkout = workoutResponse.body;

  return {
    response: workoutResponse,
    workout: newWorkout,
    statusCode: workoutResponse.statusCode,
  };
};

exports.addExerciseToWorkout = async (request, workoutId, exerciseInfo) => {
  // NOTE: exerciseInfo should contain exerciseId, exerciseSet, reps, weight, time_in_seconds
  const workoutExerciseResponse = await request
    .post(`/workouts/${workoutId}`)
    .send(exerciseInfo);

  const newExerciseInWorkout = workoutExerciseResponse.body;

  return {
    response: workoutExerciseResponse,
    exerciseInWorkout: newExerciseInWorkout,
    statusCode: workoutExerciseResponse.statusCode,
  };
};

exports.fillExercisesTable = async (request, userCredentials, exercises) => {
  // userCredentials should contain username and password
  // exercises should be an array of arrays, where each inner array contains [name, description]

  // TODO truncate it?

  // login user
  await this.loginUser(request, userCredentials);

  // Insert exercises into the database
  for (const exercise of exercises) {
    const req = {
      name: exercise[0],
      description: exercise[1],
    };
    await this.createNewExercise(request, req);
  }

  // logout user
  await this.logoutUser(request);
};
