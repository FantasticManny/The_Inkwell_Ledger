const express = require('express');
const path = require('path');
const helmet = require('helmet');
const passport = require('passport');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const pool = require('./db/pool');
const sessionConfig = require('./config/session');
const errorHandler = require('./middleware/errorHandler');

// Route files
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const apiRouter = require('./routes/api');

require('./config/passport');

const app = express();

//   Security headers             ─
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://avatars.githubusercontent.com', 'https://lh3.googleusercontent.com'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"],
    },
  },
}));

//   View engine               
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

//   Static files              ──
app.use(express.static(path.join(__dirname, '../public')));

//   Body parsers              ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

//   Session   
app.use(session({
  store: new PgSession({ pool, tableName: 'sessions', createTableIfMissing: true }),
  ...sessionConfig,
}));

//   Passport  ──
app.use(passport.initialize());
app.use(passport.session());

//   Template locals             ──
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.currentPath = req.path;
  next();
});

//   Routes   ─
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/api', apiRouter);

//   Admin SPA — serve React build         
app.get('/admin', (req, res) => {
  if (!req.isAuthenticated() || req.user.role !== 'admin') {
    return res.redirect('/login?redirect=/admin');
  }
  res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});
app.get('/admin/*', (req, res) => {
  if (!req.isAuthenticated() || req.user.role !== 'admin') {
    return res.redirect('/login?redirect=/admin');
  }
  res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});

//   404    ─
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    statusCode: 404,
    message: 'The page you are looking for does not exist.',
  });
});

//   Error handler              ─
app.use(errorHandler);

module.exports = app;
