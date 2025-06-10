// NOTE: below are the mandatory parameters for the new user request
// in exports.newUserMandatoryParams
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

exports.newUserMandatoryParams = [
  "username",
  "email",
  "is_premium",
  "is_early_adopter",
  "created_at",
  "password",
];

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

exports.benchPress = [
  "bench press",
  "A compound upper body exercise where you lie on a bench and press a barbell upwards, targeting chest, shoulders, and triceps.",
];
exports.barbellRow = [
  "barbell row",
  "An upper body exercise where you bend forward at the hips, pulling a barbell towards your torso, targeting back muscles like lats and rhomboids.",
];
exports.pullUp = [
  "pull up",
  "A bodyweight exercise where you hang from a bar and pull yourself up until your chin is above the bar, primarily targeting the back, arms, and shoulders.",
];
exports.dip = [
  "dip",
  "A bodyweight exercise where you suspend yourself between parallel bars and lower your body until your upper arms are parallel to the ground, targeting chest, triceps, and shoulders.",
];
exports.deadLift = [
  "dead lift",
  "A compound movement where you lift a barbell from the ground to a standing position, engaging muscles in the back, glutes, hamstrings, and core.",
];
exports.squat = [
  "squat",
  "A compound lower body exercise where you lower your hips towards the ground, keeping your back straight, and then stand back up, primarily targeting quadriceps, hamstrings, glutes, and core.",
];

exports.UUIDRegex =
  /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/;
