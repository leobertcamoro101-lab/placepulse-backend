class HttpError extends Error {
  constructor(message, errorCode) {
    super(message); // add a message property to the error object
    this.code = errorCode; // add a code property to the error object
  }
}

module.exports = HttpError;