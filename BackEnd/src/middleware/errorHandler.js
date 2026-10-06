function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  console.error(error);
  const status = error.status || 500;
  res.status(status).json({
    message: status >= 500 ? 'Internal server error' : error.message,
  });
}

module.exports = errorHandler;
