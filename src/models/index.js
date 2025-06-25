// Import configured Sequelize instance
const sequelize = require("./sequelizeConfig.js");
// Import models
const UserModel = require("./user.model.js");
const SubscriptionModel = require("./subscription.model.js");
const PaymentModel = require("./payment.model.js");
const WeightModel = require("./weight.model.js");
const ExerciseModel = require("./exercise.model.js");
const WorkoutModel = require("./workout.model.js");
const WorkoutTemplateModel = require("./workoutTemplate.model.js");
const WorkoutTemplateExercisesModel = require("./workoutTemplateExercises.model.js");
const UserWorkoutsModel = require("./userWorkouts.model.js");
const WorkoutExercisesModel = require("./workoutExercises.model.js");

// Initialize models with the Sequelize instance
const Subscription = SubscriptionModel(sequelize);
const Exercise = ExerciseModel(sequelize);
const User = UserModel(sequelize, { SubscriptionModel: Subscription });
const WorkoutTemplate = WorkoutTemplateModel(sequelize, { UserModel: User });
const Workout = WorkoutModel(sequelize, {
  WorkoutTemplateModel: WorkoutTemplate,
});
const UserWorkouts = UserWorkoutsModel(sequelize, {
  UserModel: User,
  WorkoutModel: Workout,
});
const WorkoutExercises = WorkoutExercisesModel(sequelize, {
  WorkoutModel: Workout,
  ExerciseModel: Exercise,
});
const Payment = PaymentModel(sequelize, {
  UserModel: User,
  SubscriptionModel: Subscription,
});
const Weight = WeightModel(sequelize, { UserModel: User });
const WorkoutTemplateExercises = WorkoutTemplateExercisesModel(sequelize, {
  WorkoutTemplateModel: WorkoutTemplate,
  ExerciseModel: Exercise,
});

// Define model associations at ORM level
// Users - Subscriptions
Subscription.hasMany(User, {
  foreignKey: "subscription_id",
  as: "users", // Alias for the association
});
User.belongsTo(Subscription, {
  foreignKey: "subscription_id",
  as: "subscription", // Alias for the association
});

// Users - Payments
User.hasMany(Payment, {
  foreignKey: "user_id",
  as: "payments", // Alias for the association
});
Payment.belongsTo(User, {
  foreignKey: "user_id",
  as: "user", // Alias for the association
});

// Users - Weights
User.hasMany(Weight, {
  foreignKey: "user_id",
  as: "weights", // Alias for the association
});
Weight.belongsTo(User, {
  foreignKey: "user_id",
  as: "user", // Alias for the association
});

// Users - Exercises
User.belongsToMany(Exercise, {
  through: "users_exercises", // Join table for many-to-many relationship
  foreignKey: "user_id",
  as: "exercises", // Alias for the association
  timestamps: false, // Disable timestamps for this association
});
Exercise.belongsToMany(User, {
  through: "users_exercises", // Join table for many-to-many relationship
  foreignKey: "exercise_id",
  as: "users", // Alias for the association
  timestamps: false, // Disable timestamps for this association
});

// Users - Workout Templates
User.hasMany(WorkoutTemplate, {
  foreignKey: "user_id",
  as: "workoutTemplates", // Alias for the association
});
WorkoutTemplate.belongsTo(User, {
  foreignKey: "user_id",
  as: "user", // Alias for the association
});

// Users - Workouts
User.belongsToMany(Workout, {
  through: UserWorkouts,
  foreignKey: "user_id",
  as: "workouts", // Alias for the association
});
Workout.belongsToMany(User, {
  through: UserWorkouts,
  foreignKey: "workout_id",
  as: "users", // Alias for the association
});

// To be able to query from UserWorkouts
UserWorkouts.belongsTo(Workout, { foreignKey: "workout_id" });
UserWorkouts.belongsTo(User, { foreignKey: "user_id" });

// Subscriptions - Payments
Subscription.hasMany(Payment, {
  foreignKey: "subscription_id",
  as: "payments", // Alias for the association
});
Payment.belongsTo(Subscription, {
  foreignKey: "subscription_id",
  as: "subscription", // Alias for the association
});

// Workout Templates - Exercises
WorkoutTemplate.belongsToMany(Exercise, {
  through: WorkoutTemplateExercises,
  foreignKey: "workout_template_id",
  as: "exercises", // Alias for the association
});
Exercise.belongsToMany(WorkoutTemplate, {
  through: WorkoutTemplateExercises,
  foreignKey: "exercise_id",
  as: "workoutTemplates", // Alias for the association
});

// Workout Templates - Workouts
WorkoutTemplate.hasMany(Workout, {
  foreignKey: "template_id",
  as: "workouts", // Alias for the association
});
Workout.belongsTo(WorkoutTemplate, {
  foreignKey: "template_id",
  as: "workoutTemplate", // Alias for the association
});

// Workouts - Exercises
Workout.belongsToMany(Exercise, {
  through: WorkoutExercises,
  foreignKey: "workout_id", // workoutExercises to workout
  otherKey: "exercise_id", // workoutExercises to exercise
  as: "exercises", // Alias for the association
});
Exercise.belongsToMany(Workout, {
  through: WorkoutExercises,
  foreignKey: "exercise_id",
  otherKey: "workout_id",
  as: "workouts", // Alias for the association
});

module.exports = {
  sequelize,
  Subscription,
  Exercise,
  User,
  WorkoutTemplate,
  Workout,
  UserWorkouts,
  WorkoutExercises,
  Payment,
  Weight,
  WorkoutTemplateExercises,
};
