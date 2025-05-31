const { DataTypes } = require("sequelize");

module.exports = (sequelize, { SubscriptionModel }) => {
  const User = sequelize.define(
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
          model: SubscriptionModel, // Model of the referenced table
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
      password_reset_token: {
        type: DataTypes.STRING(64),
        // Note: 'for forgot password functionality'
      },
      password_reset_expires: {
        type: DataTypes.DATE,
        // Note: 'for forgot password functionality'
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
      language: {
        type: DataTypes.STRING(2),
        defaultValue: "en", // Default language
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "users", // Explicitly specify the table name
      timestamps: false, // Disable automatic timestamps
      defaultScope: {
        // Exclude fields for all queries by default
        attributes: {
          exclude: [
            "password",
            "password_reset_token",
            "password_reset_expires",
          ],
        },
      },
      scopes: {
        sensitiveScope: {
          // Include sensitive fields for specific queries
          attributes: {
            include: [
              "password",
              "password_reset_token",
              "password_reset_expires",
            ],
          },
        },
      },
    }
  );

  User.prototype.toJSON = function () {
    // Exclude sensitive fields from the JSON representation
    // For example, when creating a user. In that case the defaultScope seems not to be applied
    const values = { ...this.get() };
    delete values.password;
    delete values.password_reset_token;
    delete values.password_reset_expires;
    return values;
  };

  // IMPORTANT This function is async. Research about possible problems here
  User.sync({
    //alter: true, // DOC: Use 'true' to update the table structure if it changes
    // force: false, // DOC: Use 'true' to drop the table and recreate it
  });

  return User;
};
