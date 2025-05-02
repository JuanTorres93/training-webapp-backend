const dbUsers = require("../db/users");

//////////////////////////
// READ OPERATIONS

exports.getAllUsers = async (req, res, next) => {
  const users = await dbUsers.selectAllUsers();

  res.status(200).send(users);
};

exports.getUserById = async (req, res, next) => {
  const { userId } = req.params;

  const user = await dbUsers.selectUserById(userId);

  if (user === undefined) {
    return res.status(404).json({
      msg: "User not found",
    });
  }

  res.status(200).json(user);
};

exports.getEverythingFromUserInTestEnv = async (req, res, next) => {
  const { userId } = req.params;

  const user = await dbUsers.testDbSelectEverythingFromUserId(userId);

  if (user === undefined) {
    return res.status(404).json({
      msg: "User not found",
    });
  }

  res.status(200).json(user);
};

//////////////////////////
// CREATE OPERATIONS

exports.registerNewUser = async (req, res, next) => {
  try {
    // TODO DELETE THESE DEBUG LOGS
    console.log("creating new user");

    const createdUser = await dbUsers.registerNewUser(req.body);
    // TODO DELETE THESE DEBUG LOGS
    console.log("createdUser");
    console.log(createdUser);
    return res.status(201).json(createdUser);
  } catch (error) {
    return res.status(400).json({
      msg: "Error when registering user in db",
    });
  }
};

//////////////////////////
// UDPATE OPERATIONS

exports.updateUserById = async (req, res, next) => {
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
    return res.status(404).json({
      msg: "User not found",
    });
  }

  res.status(200).json(updatedUser);
};

//////////////////////////
// DELETE OPERATIONS

exports.deleteUserById = async (req, res, next) => {
  const { userId } = req.params;

  const deletedUser = await dbUsers.deleteUser(userId);

  res.status(200).json(deletedUser);
};

exports.truncateTestTable = async (req, res, next) => {
  const truncatedTable = await dbUsers.truncateTableTest();

  res.status(200).send(truncatedTable);
};
