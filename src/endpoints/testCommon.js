exports.newUserRequestNoOauth = {
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

exports.newExerciseRequest = {
  name: "first_test_exercise",
  description: "This is the description for a test exercise",
};

exports.newWorkoutRequest = {
  name: "first_test_workout",
  description: "This is the description for a test workout",
};

exports.expectedUserProperties = [
  "id",
  "username",
  "email",
  "subscription_id",
  "last_name",
  "img",
  "second_last_name",
  "is_premium",
  "is_early_adopter",
  "created_at",
];
