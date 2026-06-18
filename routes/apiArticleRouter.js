const express = require('express');
const Article = require('../models/article');
const { isAuthenticatedJwt } = require('../middleware/auth');
const cors = require('./cors');
const { verifyToken } = require('../utils/jwt');

const router = express.Router();

router.route('/')
  .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
  .get(cors.cors, isAuthenticatedJwt, async (req, res) => {
    try {
      const articles = await Article.find({});
      return res.status(200).json(articles);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  })
  .post(cors.corsWithOptions, verifyToken, async (req, res) => {
    try {
      const article = await Article.create(req.body);
      return res.status(201).json(article);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  })
  .put(cors.corsWithOptions, verifyToken, (req, res) => {
    res.status(403).json('PUT operation not supported on /api/articles');
  })
  .delete(cors.corsWithOptions, verifyToken, (req, res) => {
    res.status(403).json('DELETE operation not supported on /api/articles');
  });

router.route('/:id')
  .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
  .get(cors.cors, isAuthenticatedJwt, async (req, res) => {
    try {
      const article = await Article.findById(req.params.id);

      if (!article) {
        return res.status(404).json({ message: 'Article not found.' });
      }

      return res.status(200).json(article);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  })
  .post(cors.corsWithOptions, verifyToken, (req, res) => {
    res.status(403).end('POST operation not supported on /api/articles/' + req.params.id);
  })
  .put(cors.corsWithOptions, verifyToken, async (req, res) => {
    try {
      const article = await Article.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });

      if (!article) {
        return res.status(404).json({ message: 'Article not found.' });
      }

      return res.status(200).json(article);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  })
  .delete(cors.corsWithOptions, verifyToken, async (req, res) => {
    try {
      const article = await Article.findByIdAndDelete(req.params.id);

      if (!article) {
        return res.status(404).json({ message: 'Article not found.' });
      }

      return res.status(200).json({
        message: 'Article deleted.',
        article
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  });

module.exports = router;
