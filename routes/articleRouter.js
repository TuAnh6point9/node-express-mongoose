const express = require('express');
const Article = require('../models/article');
const { isAuthenticatedPassport } = require('../middleware/auth');

const articleRouter = express.Router();
articleRouter.use(express.json());
articleRouter.use(express.urlencoded({extended:true}));
articleRouter.route('/')
    
    .get(isAuthenticatedPassport, async (req, res) => {
        try {    
          const articles = await Article.find({});
          res.status(200).json(articles);
        } catch (err) {
          res.status(500).json({ message: err.message });
        }
      })
      
      // POST a new article
      .post(isAuthenticatedPassport, async (req, res) => {
        try {
          const article = await Article.create(req.body);
          res.status(201).json(article);
        } catch (err) {
          res.status(400).json({ message: err.message });
        }
      })
      // PUT a new article
      .put(isAuthenticatedPassport, async (req, res) => {
        try {
          res.status(403).json('PUT operation not supported on /articles');
        } catch (err) {
          res.status(400).json({ message: err.message });
        }
      })
      // DELETE all articles
      .delete(isAuthenticatedPassport, async (req, res) => {
        try {
          res.status(200).json('Deleting all articles');
        } catch (err) {
          res.status(400).json({ message: err.message });
        }
      })
  articleRouter.route('/:id')  
      // GET a specific article
    .get(isAuthenticatedPassport, async (req, res) => {
      try {    
        const article = await Article.findById(req.params.id);

        if (!article) {
          return res.status(404).json({ message: 'Article not found.' });
        }

        return res.status(200).json(article);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    })
    // POST a specific article
    .post(isAuthenticatedPassport, async (req, res) => {
      try {
        res.status(403).end('POST operation not supported on /articles/'+ req.params.id);
        
      } catch (err) {
        res.status(400).json({ message: err.message });
      }
    })
    // PUT a new article
    .put(isAuthenticatedPassport, async (req, res) => {
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
        res.status(400).json({ message: err.message });
      }
    })

    // DELETE an article
    .delete(isAuthenticatedPassport, async (req, res) => {
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
        res.status(500).json({ message: err.message });
      }
    });

module.exports = articleRouter;
