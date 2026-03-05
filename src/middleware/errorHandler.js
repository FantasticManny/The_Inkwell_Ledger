function errorHandler(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  console.error(`[${new Date().toISOString()}] ${statusCode} — ${err.message}`);
  if (isDev && err.stack) console.error(err.stack);

  // Handle unique constraint violations (PostgreSQL error code 23505)
  if (err.code === '23505') {
    const field = err.detail?.match(/\((.+?)\)/)?.[1] || 'field';
    if (req.path.startsWith('/api/')) {
      return res.status(409).json({ error: `A record with this ${field} already exists.` });
    }
  }

  if (req.path.startsWith('/api/')) {
    return res.status(statusCode).json({
      error: isDev ? err.message : 'An unexpected error occurred.',
      ...(isDev && { stack: err.stack }),
    });
  }

  res.status(statusCode).render('error', {
    title: statusCode === 404 ? 'Not Found' : 'Server Error',
    statusCode,
    message: isDev ? err.message : 'Something went wrong. Please try again.',
  });
}

module.exports = errorHandler;
