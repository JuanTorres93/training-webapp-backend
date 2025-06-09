exports.loginUser = async (request, userInfo) => {
  await request.post("/login").send({
    username: userInfo.username,
    password: userInfo.password,
  });
};

exports.logoutUser = async (request) => {
  await request.get("/logout");
};

exports.createNewUser = async (request, userInfo) => {
  const newUserResponse = await request.post("/users").send(userInfo);

  return {
    response: newUserResponse,
    user: newUserResponse.body,
    statusCode: newUserResponse.statusCode,
  };
};
