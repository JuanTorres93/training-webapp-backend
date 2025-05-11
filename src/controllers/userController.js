const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const dbUsers = require("../db/users");
const Email = require("../utils/email");

//////////////////////////
// READ OPERATIONS

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await dbUsers.selectAllUsers();

  res.status(200).send(users);
});

exports.getUserById = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  const user = await dbUsers.selectUserById(userId);

  if (user === undefined) {
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
  const createdUser = await dbUsers.registerNewUser(req.body);

  // Send email to the user if it is not a test environment
  // When testng the frontend, back is called as development, so
  // DB_HOST is used to discern if it is a test environment in that case
  if (
    createdUser &&
    process.env.NODE_ENV !== "test" &&
    process.env.DB_HOST !== "db-test-for-frontend"
  ) {
    await new Email(createdUser).sendWelcome();
  }

  return res.status(201).json(createdUser);
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
  await new Email(user).sendPasswordReset(
    `${process.env.CLIENT_URL}/resetPassword/${resetToken}`
  );

  res.status(200).json({
    status: "success",
    message: "Token sent to email!",
  });
});
