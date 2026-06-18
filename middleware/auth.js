const passport = require('passport');

function isAuthenticated(req, res, next) {
  try {
    if (req.cookies && req.cookies.username) {
      return next();
    }

    return res.status(401).json({
      message: 'You are not authenticated. Please login or signup.',
      nextSteps: {
        login: '/users/login',
        signup: '/users/signup'
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
}

async function isAuthenticatedSession(req, res, next) {
  try {
    if (req.session && req.session.userId) {
      return next();
    }

    return res.status(401).json({
      message: 'You are not authenticated. Please login or signup.',
      nextSteps: {
        login: '/users/login',
        signup: '/users/signup'
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
}

function isAuthenticatedPassport(req, res, next) {
  try {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }

    return res.status(401).json({
      message: 'You are not authenticated. Please login or signup.',
      nextSteps: {
        login: '/users/login',
        signup: '/users/signup'
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
}

function isAuthenticatedJwt(req, res, next) {
  return passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(401).json({
        message: 'Invalid or missing JWT token.'
      });
    }

    req.user = user;
    return next();
  })(req, res, next);
}

module.exports = {
  isAuthenticated,
  isAuthenticatedSession,
  isAuthenticatedPassport,
  isAuthenticatedJwt
};
