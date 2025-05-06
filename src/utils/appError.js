class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    // this attribute is used to then test if the error is operational
    // and only send messages to the client when we are
    // using this class.
    this.isOperational = true;

    // arguments: current object and AppError class
    // this will remove the constructor call from the stack trace
    // and only show the error that was thrown.
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
