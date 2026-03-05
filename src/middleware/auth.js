/**
 * Require the user to be logged in.
 * For API routes → 401 JSON. For page routes → redirect to login.
 */
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();

  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
}

/**
 * Require the user to be an admin.
 */
function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') return next();

  if (req.path.startsWith('/api/')) {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  return res.status(403).render('error', {
    title: 'Forbidden',
    statusCode: 403,
    message: 'You do not have permission to access this page.',
  });
}

module.exports = { isAuthenticated, isAdmin };
