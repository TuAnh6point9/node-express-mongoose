var express = require('express');
var jwt = require('jsonwebtoken');
var passport = require('passport');
var User = require('../models/user');
var { isAuthenticatedJwt } = require('../middleware/auth');
var router = express.Router();

function createJwtToken(user) {
  const payload = {
    id: user._id.toString(),
    username: user.username
  };

  return jwt.sign(
    payload,
    process.env.JWT_SECRET || '123456789',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    }
  );
}

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/me', function(req, res) {
  res.status(200).json({
    authenticated: !!(req.isAuthenticated && req.isAuthenticated()),
    user: req.user
      ? {
          id: req.user._id,
          username: req.user.username,
          admin: req.user.admin
        }
      : null
  });
});

router.get('/me-jwt', isAuthenticatedJwt, function(req, res) {
  res.status(200).json({
    authenticated: true,
    authType: 'jwt',
    user: {
      id: req.user._id,
      username: req.user.username,
      admin: req.user.admin
    }
  });
});

router.post('/signup', async function(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const registeredUser = await User.register(new User({ username }), password);

    req.login(registeredUser, function(error) {
      if (error) {
        return next(error);
      }

      return res.status(200).json({
        success: true,
        status: 'Registration Successful!'
      });
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

router.post('/signup-jwt', async function(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const registeredUser = await User.register(new User({ username }), password);
    const token = createJwtToken(registeredUser);

    return res.status(200).json({
      success: true,
      message: 'JWT signup successfully',
      token
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

router.post('/login-jwt', function(req, res, next) {
  passport.authenticate('local', { session: false }, function(err, user, info) {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info && info.message ? info.message : 'Invalid username or password'
      });
    }

    const token = createJwtToken(user);

    return res.status(200).json({
      success: true,
      message: 'JWT login successfully',
      token
    });
  })(req, res, next);
});

router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info && info.message ? info.message : 'Invalid username or password'
      });
    }

    req.login(user, function(loginErr) {
      if (loginErr) {
        return next(loginErr);
      }

      return res.status(200).json({
        success: true,
        status: 'Login successfully'
      });
    });
  })(req, res, next);
});

router.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) {
      return next(err);
    }

    req.session.destroy(function(sessionErr) {
      if (sessionErr) {
        return next(sessionErr);
      }

      res.clearCookie('connect.sid');
      res.clearCookie('username');
      return res.status(200).json({
        message: 'Logged out'
      });
    });
  });
});

module.exports = router;
