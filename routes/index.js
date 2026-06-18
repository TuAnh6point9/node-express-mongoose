var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  return res.render('index', {
    title: 'Sign in'
  });
});

router.get('/workspace', function(req, res) {
  res.render('workspace', {
    title: 'Article Workspace'
  });
});

module.exports = router;
