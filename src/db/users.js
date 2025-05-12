const crypto = require("crypto");

const { query } = require("./index");
const qh = require("./queryHelper.js");
const { selectFreeTrialSubscription } = require("./subscriptions.js");
const { createPayment } = require("./payments.js");
const { getPoolClient } = require("./index.js");

const TABLE_NAME = "users";
const SELECT_USER_FIELDS =
  "id, username, email, subscription_id, last_name, img, second_last_name, is_premium, is_early_adopter, created_at";

const createPasswordResetToken = () => {
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

const checkStringInFieldInUse = async (field, value) => {
  const q =
    "SELECT " +
    field +
    " FROM " +
    TABLE_NAME +
    " WHERE LOWER(" +
    field +
    ") = LOWER($1);";
  const params = [value];

  // Must return a promise to be able to await when calling from another file
  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error)
        return reject({
          error,
          exists: null,
        });

      if (results !== undefined && results.rows.length > 0) {
        resolve(true);
      } else {
        return reject({
          error: null,
          exists: false,
        });
      }
    });
  });
};

const checkEmailInUse = async (email) => {
  try {
    // checkStringInFieldInUse only resolves to true
    const exists = await checkStringInFieldInUse("email", email);

    return exists;
  } catch (error) {
    if (error.error !== null) throw error;

    return false;
  }
};

const checkAliasInUse = async (username) => {
  try {
    // checkStringInFieldInUse only resolves to true
    return await checkStringInFieldInUse("username", username);
  } catch (error) {
    if (error.error !== null) throw error;

    return false;
  }
};

const registerNewUser = async ({
  username,
  email,
  password,
  is_premium,
  is_early_adopter,
  created_at,
  subscription_id,
  oauth_registration,
  language = "en",
}) => {
  // Build query
  let requiredFields = [
    "username",
    "email",
    "password",
    "is_premium",
    "is_early_adopter",
    "created_at",
    "language",
  ];
  let requiredValues = [
    username,
    email,
    password,
    is_premium,
    is_early_adopter,
    created_at,
    language,
  ];

  let optionalFields = ["subscription_id", "oauth_registration"];

  let subsId;
  if (!subscription_id) {
    subsId = await selectFreeTrialSubscription();
    subsId = subsId.id;
  } else {
    subsId = subscription_id;
  }

  const oauth = oauth_registration ? oauth_registration : null;
  let optionalValues = [subsId, oauth];

  let returningFields = [
    "id",
    "username",
    "email",
    "subscription_id",
    "last_name",
    "img",
    "second_last_name",
    "is_premium",
    "is_early_adopter",
    "language",
    "created_at",
  ];

  const { q, params } = qh.createInsertIntoTableStatement(
    TABLE_NAME,
    requiredFields,
    requiredValues,
    optionalFields,
    optionalValues,
    returningFields
  );

  return new Promise((resolve, reject) => {
    query(q, params, async (error, results) => {
      if (error) return reject(error);

      const createdUser = results.rows[0];

      const endFreeTrialDate = new Date();
      // Add 1 month to the current date
      endFreeTrialDate.setMonth(endFreeTrialDate.getMonth() + 1);

      await createPayment({
        userId: createdUser.id,
        subscriptionId: subsId,
        amountInEur: 0,
        nextPaymentDate: endFreeTrialDate,
      });
      resolve(createdUser);
    });
  });
};

const selectAllUsers = () => {
  const q = "SELECT " + SELECT_USER_FIELDS + " FROM " + TABLE_NAME + ";";
  const params = [];

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) return reject(error);
      const users = results.rows;
      resolve(users);
    });
  });
};

const selectUserById = async (id) => {
  const q =
    "SELECT " + SELECT_USER_FIELDS + " FROM " + TABLE_NAME + " WHERE id = $1;";
  const params = [id];

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) return reject(error);
      const user = results.rows[0];
      resolve(user);
    });
  });
};

const selectUserByEmail = async (email) => {
  const q =
    "SELECT " +
    SELECT_USER_FIELDS +
    " FROM " +
    TABLE_NAME +
    " WHERE email = $1;";
  const params = [email];

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) return reject(error);
      const user = results.rows[0];
      resolve(user);
    });
  });
};

const selectUserByResetToken = async (resetToken) => {
  const q =
    "SELECT id FROM " +
    TABLE_NAME +
    " WHERE password_reset_token = $1 AND password_reset_expires > NOW();";
  const params = [resetToken];

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) return reject(error);
      const user = results.rows[0];
      resolve(user);
    });
  });
};

const selectUserRegisteredByOAuth = async (email) => {
  const q =
    "SELECT oauth_registration FROM " + TABLE_NAME + " WHERE email = $1;";
  const params = [email];

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) return reject(error);
      const oauthRegistration = results.rows[0].oauth_registration;
      resolve(oauthRegistration);
    });
  });
};

const updateUser = async (id, userObject) => {
  let returningFields = [
    "id",
    "username",
    "email",
    "last_name",
    "img",
    "second_last_name",
  ];

  const { q, params } = qh.createUpdateTableStatement(
    TABLE_NAME,
    id,
    userObject,
    returningFields
  );

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) return reject(error);

      const updatedUser = results.rows[0];
      resolve(updatedUser);
    });
  });
};

const updateResetPasswordToken = async (id, resetToken, expires) => {
  let returningFields = ["email"];

  const { q, params } = qh.createUpdateTableStatement(
    TABLE_NAME,
    id,
    {
      password_reset_token: resetToken,
      password_reset_expires: expires,
    },
    returningFields
  );

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) return reject(error);

      const updatedUser = results.rows[0];
      resolve(updatedUser);
    });
  });
};

const updateUserPassword = async (id, password) => {
  // NOTE: this function must be called after the middleware that checks
  // if the password and passwordConfirm are the same
  let returningFields = ["id", "email"];

  const { q, params } = qh.createUpdateTableStatement(
    TABLE_NAME,
    id,
    {
      password: password,
      password_reset_token: null,
      password_reset_expires: null,
    },
    returningFields
  );

  return new Promise((resolve, reject) => {
    query(q, params, (error, results) => {
      if (error) return reject(error);

      const updatedUser = results.rows[0];
      resolve(updatedUser);
    });
  });
};

const deleteUser = async (id) => {
  const client = await getPoolClient();

  let deletedUser;

  try {
    const paramsUserId = [id];
    const deleteUserPaymentsQuery = "DELETE FROM payments WHERE user_id = $1;";
    await client.query(deleteUserPaymentsQuery, paramsUserId);

    const qDeleteUser =
      "DELETE FROM " +
      TABLE_NAME +
      " WHERE id = $1 " +
      "RETURNING id, username, email, last_name, img, second_last_name;";
    const results = await client.query(qDeleteUser, paramsUserId);
    deletedUser = results.rows[0];
  } catch (error) {
    await client.query("ROLLBACK;");
    throw error;
  } finally {
    client.release();
  }

  return deletedUser;
};

const truncateTableTest = () => {
  const appIsBeingTested = process.env.NODE_ENV === "test";

  // Only allow truncating table in test environment
  if (!appIsBeingTested) {
    return new Promise((resolve, reject) => {
      // Test for making malicious people think they got something
      resolve("Truncated " + TABLE_NAME);
    });
  }

  const q = "TRUNCATE " + TABLE_NAME + " CASCADE;";
  const params = [];

  return new Promise((resolve, reject) => {
    query(
      q,
      params,
      (error, results) => {
        if (error) {
          return reject(error);
        }

        resolve("Table " + TABLE_NAME + " truncated in test db.");
      },
      true
    );
  });
};

const testDbSelectEverythingFromUserId = (id) => {
  const appIsBeingTested = process.env.NODE_ENV === "test";

  // Only allow truncating table in test environment
  if (!appIsBeingTested) {
    return new Promise((resolve, reject) => {
      // Test for making malicious people think they got something
      resolve("Nothing in " + TABLE_NAME);
    });
  }

  const q = "SELECT * FROM " + TABLE_NAME + " WHERE id = $1;";
  const params = [id];

  return new Promise((resolve, reject) => {
    query(
      q,
      params,
      (error, results) => {
        if (error) return reject(error);

        resolve(results.rows[0]);
      },
      true
    );
  });
};

module.exports = {
  createPasswordResetToken,
  checkStringInFieldInUse,
  checkEmailInUse,
  checkAliasInUse,
  registerNewUser,
  selectAllUsers,
  selectUserById,
  selectUserByEmail,
  selectUserByResetToken,
  selectUserRegisteredByOAuth,
  updateUser,
  updateUserPassword,
  updateResetPasswordToken,
  deleteUser,
  truncateTableTest,
  testDbSelectEverythingFromUserId,
};
