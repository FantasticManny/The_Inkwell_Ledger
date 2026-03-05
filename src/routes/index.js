const express = require('express');
const router = express.Router();
const {
  getPublishedPosts, countPublishedPosts,
  getPostBySlug, incrementPostViews,
  getAllTags, getTagBySlug,
  getApprovedComments, createComment,
} = require('../db/queries');
const { isAuthenticated } = require('../middleware/auth');
const { commentLimiter } = require('../middleware/rateLimiter');
const { body, validationResult } = require('express-validator');

//   Helpers  ──
function readingTime(html = '') {
  const words = html.replace(/<[^>]+>/g, '').split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

//   Homepage  ──
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 8;
    const [posts, total, tags] = await Promise.all([
      getPublishedPosts({ page, limit }),
      countPublishedPosts(),
      getAllTags(),
    ]);
    const totalPages = Math.ceil(total / limit);
    res.render('index', { title: 'Home', posts, tags, page, totalPages, total });
  } catch (err) { next(err); }
});

//   Single Post              ──
router.get('/blog/:slug', async (req, res, next) => {
  try {
    const [post, tags] = await Promise.all([
      getPostBySlug(req.params.slug),
      getAllTags(),
    ]);
    if (!post) return res.status(404).render('error', { title: 'Not Found', statusCode: 404, message: 'Post not found.' });

    // Increment views (fire & forget — don't block render)
    incrementPostViews(post.id).catch(() => {});

    const comments = await getApprovedComments(post.id);
    res.render('post', {
      title: post.title,
      post,
      comments,
      tags,
      readingTime: readingTime(post.content_html),
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      errors: [],
      formData: {},
    });
  } catch (err) { next(err); }
});

//   Submit Comment              
router.post(
  '/blog/:slug/comment',
  isAuthenticated,
  commentLimiter,
  [body('body').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment must be between 1 and 2000 characters.')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      const [post, tags, comments] = await Promise.all([
        getPostBySlug(req.params.slug),
        getAllTags(),
        getApprovedComments((await getPostBySlug(req.params.slug))?.id),
      ]);

      if (!post) return res.status(404).render('error', { title: 'Not Found', statusCode: 404, message: 'Post not found.' });

      if (!errors.isEmpty()) {
        return res.status(400).render('post', {
          title: post.title, post, comments, tags,
          readingTime: readingTime(post.content_html),
          errors: errors.array(),
          formData: req.body,
        });
      }

      await createComment({ postId: post.id, authorId: req.user.id, body: req.body.body });
      res.redirect(`/blog/${post.slug}#comments`);
    } catch (err) { next(err); }
  }
);

//   Tag Page  ──
router.get('/tag/:slug', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 8;
    const [tag, posts, total, allTags] = await Promise.all([
      getTagBySlug(req.params.slug),
      getPublishedPosts({ page, limit, tagSlug: req.params.slug }),
      countPublishedPosts(req.params.slug),
      getAllTags(),
    ]);
    if (!tag) return res.status(404).render('error', { title: 'Not Found', statusCode: 404, message: 'Tag not found.' });
    const totalPages = Math.ceil(total / limit);
    res.render('tag', { title: `#${tag.name}`, tag, posts, tags: allTags, page, totalPages, total });
  } catch (err) { next(err); }
});

//   Login Page  
router.get('/login', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/');
  res.render('login', { title: 'Sign In', redirect: req.query.redirect || '/' });
});

//   About   ──
router.get('/about', async (req, res, next) => {
  try {
    const tags = await getAllTags();
    res.render('about', { title: 'About', tags });
  } catch (err) { next(err); }
});

module.exports = router;
