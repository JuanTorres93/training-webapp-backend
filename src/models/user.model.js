const crypto = require("crypto");
const { DataTypes, fn, col, where } = require("sequelize");

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

  // Methods
  User.checkEmailInUse = async function (email) {
    const user = await User.findOne({
      where: where(fn("LOWER", col("email")), email.toLowerCase()),
    });
    return user !== null; // Returns true if email is in use, false otherwise
  };

  User.checkUsernameInUse = async function (username) {
    const user = await User.findOne({
      where: where(fn("LOWER", col("username")), username.toLowerCase()),
    });
    return user !== null; // Returns true if username is in use, false otherwise
  };

  User.createPasswordResetToken = () => {
    // Create a reset token that will be sent to the user
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Save the hashed token to the database
    // This is done to prevent the token from being exposed in the database.
    // In this way, even if someone gets access to the database,
    // they won't be able to use the token to reset the password.
    const resetTokenForDB = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Give the token an expiration date of 10 minutes
    // This is done to prevent the token from being used after a certain time.
    const passwordResetExpires = new Date(
      Date.now() + 10 * 60 * 1000
    ).toISOString();

    return {
      resetToken,
      resetTokenForDB,
      passwordResetExpires,
    };
  };

  User.updateResetPasswordToken = async (userId, resetToken, expires) => {
    const user = await User.findByPk(userId);

    await user.update({
      password_reset_token: resetToken,
      password_reset_expires: expires,
    });
  };

  User.updateUserPassword = async (id, password) => {
    // NOTE: this function must be called after the middleware that checks
    // if the password and passwordConfirm are the same

    // TODO IMPORTANT check what happens if user does not exist
    const user = await User.findByPk(id);

    await user.update({
      password: password,
      password_reset_token: null,
      password_reset_expires: null,
    });
  };

  return User;
};
