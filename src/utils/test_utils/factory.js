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
