const { DataTypes } = require("sequelize");

module.exports = (sequelize, { UserModel }) => {
  const Weight = sequelize.define(
    "Weight",
    {
      user_id: {
        primaryKey: true, // NOTE Shared with the date field
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: UserModel, // Model of the referenced table
          key: "id",
        },
      },
      date: {
        primaryKey: true, // NOTE Shared with the user_id field
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      value: {
        type: DataTypes.DECIMAL,
      },
    },
    {
      tableName: "weights", // Explicitly specify the table name
      timestamps: false, // Disable timestamps if not needed
    }
  );

  return Weight;
};
