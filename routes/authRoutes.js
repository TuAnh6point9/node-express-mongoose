const express = require('express');
const passport = require('passport');
const { signToken } = require('../utils/jwt');

const router = express.Router();

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: 'Google authentication failed' });
    const token = signToken(user);
    return res.status(200).json({
      token: token,
      user: {
        id: user.id,
        displayName: user.displayName
      }
    });
  })(req, res, next);
});

router.get('/facebook', passport.authenticate('facebook', { scope: ['public_profile', 'email'] }));

router.get('/facebook/callback', (req, res, next) => {
  passport.authenticate('facebook', { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: 'Facebook authentication failed' });
    }
    const token = signToken(user);
    return res.status(200).json({
      token: token,
      user: {
        id: user.id,
        displayName: user.displayName
      }
    });
  })(req, res, next);
});

module.exports = router;
