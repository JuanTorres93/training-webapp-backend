const crypto = require("crypto");

const { sequelize, User, Subscription, Payment } = require("../models");

const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const dbUsers = require("../db/users");
const Email = require("../utils/email");
const hash = require("../hashing");

//////////////////////////
// READ OPERATIONS

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await dbUsers.selectAllUsers();

  res.status(200).send(users);
});

exports.getUserById = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await User.findByPk(userId);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json(user);
});

exports.getEverythingFromUserInTestEnv = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await dbUsers.testDbSelectEverythingFromUserId(userId);

  if (user === undefined) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json(user);
});

//////////////////////////
// CREATE OPERATIONS

exports.registerNewUser = catchAsync(async (req, res, next) => {
  const resultNewUser = await sequelize.transaction(async (t) => {
    // Get subscription ID
    const freeTrialSubscription = await Subscription.findOne({
      where: { type: "FREE_TRIAL" },
    });
    let subscriptionId;

    if (freeTrialSubscription) {
      subscriptionId = freeTrialSubscription.id;
    } else {
      subscriptionId = req.body.subscription_id;
    }

    // Create the new user
    const newUser = await User.create(
      {
        ...req.body,
        subscription_id: subscriptionId,
      },
      { transaction: t }
    );

    const endFreeTrialDate = new Date();
    // Add 1 month to the current date
    endFreeTrialDate.setMonth(endFreeTrialDate.getMonth() + 1);

    // Create a payment record for the free trial
    await Payment.create(
      {
        user_id: newUser.id,
        subscription_id: subscriptionId,
        amount_in_eur: 0, // Free trial has no cost
        next_payment_date: endFreeTrialDate,
      },
      { transaction: t }
    );

    return newUser;
  });

  // Send email to the user if it is not a test environment
  // When testng the frontend, back is called as development, so
  // DB_HOST is used to discern if it is a test environment in that case
  if (
    resultNewUser &&
    process.env.NODE_ENV !== "test" &&
    process.env.DB_HOST !== "db-test-for-frontend"
  ) {
    new Email(resultNewUser).sendWelcome();
  }

  return res.status(201).json(resultNewUser);
});

//////////////////////////
// UDPATE OPERATIONS

exports.updateUserById = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { alias, email, password, last_name, second_last_name, img } = req.body;

  const newUserInfo = {
    alias,
    email,
    password,
    last_name,
    second_last_name,
    img,
  };

  const updatedUser = await dbUsers.updateUser(userId, newUserInfo);

  if (updatedUser === undefined) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json(updatedUser);
});

//////////////////////////
// DELETE OPERATIONS

exports.deleteUserById = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const deletedUser = await dbUsers.deleteUser(userId);

  res.status(200).json(deletedUser);
});

exports.truncateTestTable = catchAsync(async (req, res, next) => {
  const truncatedTable = await dbUsers.truncateTableTest();

  res.status(200).send(truncatedTable);
});

//////////////////////////
// FORGOT PASSWORD

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const { email } = req.body;
  const user = await dbUsers.selectUserByEmail(email);

  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  // 2) Generate the random reset token

  const { resetToken, resetTokenForDB, passwordResetExpires } =
    dbUsers.createPasswordResetToken();

  await dbUsers.updateResetPasswordToken(
    user.id,
    resetTokenForDB,
    passwordResetExpires
  );

  // 3) Send it to user's email
  const { language } = req.params;
  try {
    await new Email(user).sendPasswordReset(
      `${process.env.CLIENT_URL}/resetPassword/${resetToken}`,
      language
    );
  } catch (error) {
    await dbUsers.updateResetPasswordToken(user.id, null, null);
    return next(
      new AppError(
        "There was an error sending the reset password email. Try again later!",
        500
      )
    );
  }

  res.status(200).json({
    status: "success",
    message: "Token sent to email!",
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await dbUsers.selectUserByResetToken(hashedToken);

  // 2) If token has not expired, and there is a user,
  // set the new password
  if (!user) return next(new AppError("Token is invalid or has expired", 400));

  const newPassword = req.body.password;
  const hashedNewPassword = await hash.plainTextHash(newPassword);

  await dbUsers.updateUserPassword(user.id, hashedNewPassword);

  // 3) TODO Update changedPasswordAt property for the user

  res.status(200).json({
    status: "success",
    message: "Password reseted successfully!",
  });
});
