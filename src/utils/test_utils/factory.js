exports.checkCorrectResource = (
  getResourceObject, // Callback function that returns the resource object to check
  expectedProperties,
  notExpectedProperties = []
) => {
  return () => {
    const resourceObject = getResourceObject();
    // Check expectedProperties is an array
    if (!Array.isArray(expectedProperties)) {
      throw new Error("expectedProperties must be an array");
    }

    // Check if the resource object has all expected properties
    expectedProperties.forEach((property) => {
      expect(resourceObject).toHaveProperty(property);
    });

    if (notExpectedProperties.length > 0) {
      // Check if the resource object does not have any of the notExpectedProperties
      notExpectedProperties.forEach((property) => {
        expect(resourceObject).not.toHaveProperty(property);
      });
    }
  };
};

exports.checkStatusCode = (getResponse, expectedStatusCode) => {
  return () => {
    const response = getResponse();
    if (typeof expectedStatusCode !== "number") {
      throw new Error("expectedStatusCode must be a number");
    }
    expect(response.statusCode).toStrictEqual(expectedStatusCode);
  };
};

exports.checkUnhappyRequest = (
  requestAgent,
  endpoint,
  body,
  expectedStatusCode
) => {
  return async () => {
    let response = await requestAgent.post(endpoint).send(body);

    expect(response.statusCode).toStrictEqual(expectedStatusCode);
  };
};

exports.checkURLParamIsNotUUID = (
  requestAgent,
  endpoint,
  method = "get",
  body = {}
) => {
  // NOTE: endpoint must contain the placeholder TEST_PARAM for the UUID
  return async () => {
    const wrongIds = [
      "wrongId",
      "true",
      "false",
      "123",
      "-23",
      "00000000-0000-0000-0000-00000000000", // too short
      "00000000-0000-0000-0000-0000000000000", // too long
      "00000000-0000-0000-0000-00000000000g", // invalid character
      // TODO extract SQL injection attempts to a separate test, make
      // it reusable and apply it to all endpoints
      // SQL injection attempts
      "00000000-0000-0000-0000-000000000000; DROP TABLE users;",
      "00000000-0000-0000-0000-000000000000' OR '1'='1",
      "00000000-0000-0000-0000-000000000000' OR '1'='1' --",
      "00000000-0000-0000-0000-000000000000' OR '1'='1' #",
      "00000000-0000-0000-0000-000000000000' OR '1'='1' UNION SELECT * FROM users --",
    ];

    for (const wrongId of wrongIds) {
      const ep = endpoint.replace("TEST_PARAM", wrongId);
      let response;

      if (method.toLowerCase() === "get") {
        response = await requestAgent.get(ep);
      } else if (method.toLowerCase() === "post") {
        response = await requestAgent.post(ep).send(body);
      } else if (method.toLowerCase() === "put") {
        response = await requestAgent.put(ep).send(body);
      } else if (method.toLowerCase() === "delete") {
        response = await requestAgent.delete(ep);
      } else {
        throw new Error(`Unsupported method: ${method}`);
      }

      expect(response.statusCode).toStrictEqual(400);
    }
  };
};
