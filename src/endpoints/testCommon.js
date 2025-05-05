const newUserRequestNoOauth = {
  username: "first_test_user",
  email: "first_user@domain.com",
  is_premium: false,
  is_early_adopter: true,
  created_at: "2021-09-01T00:00:00.000Z",
  last_name: "Manacle",
  password: "$ecur3_P@ssword",
  second_last_name: "Sanches",
  // oauth_registration: null,
};

const newExerciseRequest = {
  name: "first_test_exercise",
  description: "This is the description for a test exercise",
};

const newWorkoutRequest = {
  name: "first_test_workout",
  description: "This is the description for a test workout",
};

module.exports = {
  newUserRequestNoOauth,
  newExerciseRequest,
  newWorkoutRequest,
};
