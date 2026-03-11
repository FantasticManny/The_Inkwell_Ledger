require('dotenv').config();
const http = require('http');
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`\n    ┌                                         ─┐`);
  console.log(`    │  Blog CMS running                        │`);
  console.log(`    │  http://localhost:${PORT}                   │`);
  console.log(`    │  Admin: http://localhost:${PORT}/admin      │`);
  console.log(`    └                                         ─┘\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
    process.exit(1);
  }
  throw err;
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
