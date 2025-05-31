const { DataTypes } = require("sequelize");

module.exports = (sequelize, { UserModel }) => {
  const WorkoutTemplate = sequelize.define(
    "WorkoutTemplate",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: UserModel, // Model of the referenced table
          key: "id",
        },
      },
      name: {
        type: DataTypes.STRING(40),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(500),
      },
    },
    {
      tableName: "workout_template", // Explicitly specify the table name
      timestamps: false,
    }
  );

  return WorkoutTemplate;
};
