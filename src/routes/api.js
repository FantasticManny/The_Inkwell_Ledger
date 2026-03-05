const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const sanitizeHtml = require('sanitize-html');
const slugify = require('slugify');
const { body, param, validationResult } = require('express-validator');
const { isAdmin, isAuthenticated } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const {
  getAllPosts, getPostById, createPost, updatePost, deletePost,
  getAllTags, createTag, updateTag, deleteTag,
  getAllComments, updateCommentApproval, deleteComment,
  getDashboardStats,
} = require('../db/queries');

//   Config   ─
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed.'));
  },
});

router.use(apiLimiter);

//   Helpers  ──
function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
}

function makeSlug(title) {
  return slugify(title, { lower: true, strict: true, trim: true });
}

const SANITIZE_OPTS = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'figure', 'figcaption']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ['src', 'alt', 'title', 'width', 'height'],
    '*': ['class'],
  },
};

//   ME    ─
router.get('/me', isAuthenticated, (req, res) => {
  const { id, name, email, role, avatar_url } = req.user;
  res.json({ id, name, email, role, avatar_url });
});

//   DASHBOARD  
router.get('/dashboard', isAdmin, async (req, res, next) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (err) { next(err); }
});

//   POSTS   ─
router.get('/posts', isAdmin, async (req, res, next) => {
  try {
    const { page = 1, status, search } = req.query;
    const posts = await getAllPosts({ page: parseInt(page), status, search });
    res.json(posts);
  } catch (err) { next(err); }
});

router.get('/posts/:id', isAdmin, async (req, res, next) => {
  try {
    const post = await getPostById(parseInt(req.params.id));
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    res.json(post);
  } catch (err) { next(err); }
});

router.post('/posts', isAdmin, [
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required (max 255 chars).'),
  body('status').isIn(['draft', 'published', 'archived']).withMessage('Invalid status.'),
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return;
    const { title, content, contentHtml, excerpt, coverImage, status, tagIds } = req.body;
    const slug = makeSlug(title) + '-' + Date.now();
    const safeHtml = sanitizeHtml(contentHtml || '', SANITIZE_OPTS);
    const post = await createPost({
      title, slug, content, contentHtml: safeHtml, excerpt,
      coverImage, status, authorId: req.user.id, tagIds: tagIds || [],
    });
    res.status(201).json(post);
  } catch (err) { next(err); }
});

router.put('/posts/:id', isAdmin, [
  body('title').trim().isLength({ min: 1, max: 255 }),
  body('status').isIn(['draft', 'published', 'archived']),
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return;
    const { title, content, contentHtml, excerpt, coverImage, status, tagIds } = req.body;
    const slug = makeSlug(title) + '-' + req.params.id;
    const safeHtml = sanitizeHtml(contentHtml || '', SANITIZE_OPTS);
    const post = await updatePost(parseInt(req.params.id), {
      title, slug, content, contentHtml: safeHtml, excerpt,
      coverImage, status, tagIds: tagIds || [],
    });
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    res.json(post);
  } catch (err) { next(err); }
});

router.delete('/posts/:id', isAdmin, async (req, res, next) => {
  try {
    await deletePost(parseInt(req.params.id));
    res.json({ message: 'Post deleted.' });
  } catch (err) { next(err); }
});

//   TAGS    
router.get('/tags', isAdmin, async (req, res, next) => {
  try {
    const tags = await getAllTags();
    res.json(tags);
  } catch (err) { next(err); }
});

router.post('/tags', isAdmin, [
  body('name').trim().isLength({ min: 1, max: 50 }).withMessage('Tag name is required.'),
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return;
    const { name } = req.body;
    const slug = makeSlug(name);
    const tag = await createTag({ name, slug });
    res.status(201).json(tag);
  } catch (err) { next(err); }
});

router.put('/tags/:id', isAdmin, [
  body('name').trim().isLength({ min: 1, max: 50 }),
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return;
    const { name } = req.body;
    const slug = makeSlug(name);
    const tag = await updateTag(parseInt(req.params.id), { name, slug });
    res.json(tag);
  } catch (err) { next(err); }
});

router.delete('/tags/:id', isAdmin, async (req, res, next) => {
  try {
    await deleteTag(parseInt(req.params.id));
    res.json({ message: 'Tag deleted.' });
  } catch (err) { next(err); }
});

//   COMMENTS  ─
router.get('/comments', isAdmin, async (req, res, next) => {
  try {
    const { approved } = req.query;
    const filter = approved === 'true' ? true : approved === 'false' ? false : null;
    const comments = await getAllComments({ approved: filter });
    res.json(comments);
  } catch (err) { next(err); }
});

router.put('/comments/:id', isAdmin, [
  body('approved').isBoolean(),
], async (req, res, next) => {
  try {
    if (!validate(req, res)) return;
    const comment = await updateCommentApproval(parseInt(req.params.id), req.body.approved);
    res.json(comment);
  } catch (err) { next(err); }
});

router.delete('/comments/:id', isAdmin, async (req, res, next) => {
  try {
    await deleteComment(parseInt(req.params.id));
    res.json({ message: 'Comment deleted.' });
  } catch (err) { next(err); }
});

//   IMAGE UPLOAD              ─
router.post('/upload', isAdmin, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided.' });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'blog', resource_type: 'image' },
        (err, result) => err ? reject(err) : resolve(result)
      );
      stream.end(req.file.buffer);
    });

    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) { next(err); }
});

module.exports = router;
