const { DataTypes } = require("sequelize");

module.exports = (sequelize, { UserModel, WorkoutModel }) => {
  const UserWorkouts = sequelize.define(
    "UserWorkouts",
    {
      user_id: {
        primaryKey: true, // NOTE Composite primary key
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: UserModel, // Model of the referenced table
          key: "id",
        },
      },
      workout_id: {
        primaryKey: true, // NOTE Composite primary key
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: WorkoutModel, // Model of the referenced table
          key: "id",
        },
      },
      start_date: {
        primaryKey: true, // NOTE Composite primary key
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: "users_workouts", // Explicitly specify the table name
      timestamps: false,
    }
  );

  return UserWorkouts;
};
