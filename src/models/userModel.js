module.exports = (sequelize, DataTypes) => {
  const User = (module.exports = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING(40),
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING(70),
        allowNull: false,
        unique: true,
      },
      subscription_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "subscriptions", // Name of the referenced table
          key: "id",
        },
        // TODO Add default value para FREE_TRIAL
      },
      last_name: {
        type: DataTypes.STRING(40),
      },
      img: {
        type: DataTypes.TEXT,
      },
      second_last_name: {
        type: DataTypes.STRING(40),
      },
      password: {
        type: DataTypes.STRING(60),
        allowNull: false,
      },
      oauth_registration: {
        type: DataTypes.STRING(4),
      },
      is_premium: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      is_early_adopter: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "users", // Explicitly specify the table name
    }
  ));

  // IMPORTANT This function is async. Research about possible problems here
  User.sync({
    //alter: true, // DOC: Use 'true' to update the table structure if it changes
  });

  return User;
};
