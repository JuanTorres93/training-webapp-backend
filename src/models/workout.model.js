const { DataTypes } = require("sequelize");

module.exports = (sequelize, { WorkoutTemplateModel }) => {
  const Workout = sequelize.define(
    "Workout",
    {
      id: {
        primaryKey: true, // NOTE Shared with the date field
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // Automatically generate a UUID
        allowNull: false,
      },
      template_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: WorkoutTemplateModel, // Model of the referenced table
          key: "id",
        },
      },
      description: {
        type: DataTypes.STRING(500),
      },
    },
    {
      tableName: "workouts", // Explicitly specify the table name
      timestamps: false, // Disable timestamps if not needed
    }
  );

  return Workout;
};
