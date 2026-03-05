const express = require('express');
const passport = require('passport');
const router = express.Router();
const { authLimiter } = require('../middleware/rateLimiter');

//   Google OAuth              ──
router.get('/google', authLimiter, passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=google' }),
  (req, res) => {
    const redirect = req.query.state || '/';
    res.redirect(req.user.role === 'admin' ? '/admin' : redirect);
  }
);

//   GitHub OAuth              ──
router.get('/github', authLimiter, passport.authenticate('github', {
  scope: ['user:email'],
}));

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login?error=github' }),
  (req, res) => {
    res.redirect(req.user.role === 'admin' ? '/admin' : '/');
  }
);

//   Logout   ─
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('blog.sid');
      res.redirect('/');
    });
  });
});

module.exports = router;
