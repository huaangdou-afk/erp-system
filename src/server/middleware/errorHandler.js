// Centralized error handler middleware
function errorHandler(err, req, res, next) {
  console.error('Error:', err.message);

  // Default to 500 internal server error
  const status = err.status || err.statusCode || 500;

  // Build error response
  const response = {
    success: false,
    error: err.message || 'Internal server error',
  };

  // Include validation details if present
  if (err.details) {
    response.details = err.details;
  }

  res.status(status).json(response);
}

module.exports = errorHandler;
