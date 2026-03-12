function requestHandler() {
  return function sentryNoopMiddleware(req, res, next) {
    next();
  };
}

function errorHandler() {
  return function sentryNoopErrorMiddleware(err, req, res, next) {
    next(err);
  };
}

function captureException() {
  return;
}

module.exports = {
  captureException,
  errorHandler,
  requestHandler,
};
