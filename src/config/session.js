module.exports = {
  secret: process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-prod',
  resave: false,
  saveUninitialized: false,
  name: 'blog.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax',
  },
};
