const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Exercise = sequelize.define(
    "Exercise",
    {
      id: {
        primaryKey: true, // NOTE Shared with the date field
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // Automatically generate a UUID
        allowNull: false,
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
      tableName: "exercises", // Explicitly specify the table name
      timestamps: false, // Disable timestamps if not needed
    }
  );

  return Exercise;
};
