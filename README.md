# The Inkwell Ledger — Personal Blog CMS

A full-stack personal blog with a React-powered CMS admin panel.

**Stack:** Node.js · Express.js · PostgreSQL · EJS · React · OAuth 2.0

---

## What It Does

- **Public blog** — server-rendered with EJS (fast, SEO-friendly)
- **Admin CMS** — React SPA with Tiptap rich text editor
- **Posts** — create, edit, publish, archive, and delete
- **Tags** — organise posts by topic
- **Comments** — readers comment, admin approves or rejects
- **OAuth sign-in** — Google & GitHub login via Passport.js
- **Image upload** — Cloudinary integration
- **Role-based access** — admin vs. reader
- **Security** — Helmet.js, rate limiting, HTML sanitization, parameterized SQL

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Google OAuth app — [console.cloud.google.com](https://console.cloud.google.com)
- Cloudinary account — [cloudinary.com](https://cloudinary.com)

---

## Setup & Running

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Rename `.env.example` to `.env` and fill in your values:
```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/blogcms
SESSION_SECRET=any-long-random-string
ADMIN_EMAIL=your@email.com
NODE_ENV=development
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### 3. Create the database
```bash
psql -U postgres -c "CREATE DATABASE blogcms;"
```

### 4. Run migrations
```bash
npm run migrate
```

### 5. Build the React admin
```bash
npm run build:admin
```

### 6. Start the server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

Admin CMS at [http://localhost:3000/admin](http://localhost:3000/admin) — sign in with your `ADMIN_EMAIL` Google account.

---

## Project Structure

```
blog-cms/
├── src/
│   ├── app.js                 # Express app + middleware
│   ├── config/
│   │   ├── passport.js        # OAuth strategies
│   │   └── session.js         # Session config
│   ├── db/
│   │   ├── pool.js            # PostgreSQL connection
│   │   ├── queries.js         # All SQL queries
│   │   ├── migrate.js         # Migration runner
│   │   └── migrations/        # SQL files (001–004)
│   ├── routes/
│   │   ├── index.js           # Public EJS routes
│   │   ├── auth.js            # OAuth routes
│   │   └── api.js             # REST API for React admin
│   └── middleware/
│       ├── auth.js            # isAuthenticated, isAdmin
│       ├── errorHandler.js
│       └── rateLimiter.js
├── views/                     # EJS templates
│   ├── layouts/nav.ejs
│   ├── layouts/footer.ejs
│   ├── index.ejs              # Homepage
│   ├── post.ejs               # Single post + comments
│   ├── tag.ejs                # Posts by tag
│   ├── login.ejs
│   ├── about.ejs
│   └── error.ejs
├── public/
│   ├── css/style.css
│   ├── js/main.js
│   └── admin/                 # React build output
├── admin/                     # React admin source
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api/client.js
│   │   ├── pages/             # Dashboard, PostList, PostEditor, Tags, Comments
│   │   ├── components/        # Sidebar, Editor (Tiptap)
│   │   └── styles/admin.css
│   ├── package.json
│   └── vite.config.js
├── server.js
├── package.json
└── .env.example
```

---

## API Reference

All endpoints require authentication. Admin-only requires `role = 'admin'`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/me` | Current user |
| GET | `/api/dashboard` | Stats overview |
| GET / POST | `/api/posts` | List / create posts |
| GET / PUT / DELETE | `/api/posts/:id` | Single post |
| GET / POST | `/api/tags` | List / create tags |
| PUT / DELETE | `/api/tags/:id` | Update / delete tag |
| GET | `/api/comments` | All comments |
| PUT / DELETE | `/api/comments/:id` | Approve / delete comment |
| POST | `/api/upload` | Upload image to Cloudinary |

---

## Deployment (Render + Neon)

1. Push code to GitHub
2. Create a free PostgreSQL database at [neon.tech](https://neon.tech) — copy the connection string
3. Create a Web Service on [render.com](https://render.com) connected to your repo
   - Build command: `npm install && npm run build:admin`
   - Start command: `npm start`
4. Add all `.env` values as environment variables in Render
5. Set `NODE_ENV=production` and update all callback URLs to your live domain
6. Run `npm run migrate` once via the Render shell to create tables

---

## Development Tips

- **Rebuild admin after React changes:** `npm run build:admin` then `git push`
- **Hot reload while editing React:** `cd admin && npm run dev` (runs on port 5173)
- **Re-run migrations safely:** `npm run migrate` uses `IF NOT EXISTS` — safe to run multiple times
- **Reset database:** `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` then re-migrate
