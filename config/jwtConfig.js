const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/user');

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || '123456789'
};

passport.use(
  'jwt',
  new JwtStrategy(opts, async (jwtPayload, done) => {
    try {
      const userId = jwtPayload.id || jwtPayload._id;

      // Chỉ query DB nếu là MongoDB ObjectId hợp lệ (đúng 24 ký tự hex)
      const isMongoId = /^[a-f\d]{24}$/i.test(String(userId));

      if (isMongoId) {
        const user = await User.findById(userId);
        if (user) return done(null, user);
        return done(null, false);
      }

      // Google/Facebook ID không phải ObjectId → dùng thẳng payload từ token
      return done(null, jwtPayload);
    } catch (error) {
      return done(error, false);
    }
  })
);

module.exports = passport;
