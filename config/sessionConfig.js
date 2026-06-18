const MongoStore = require('connect-mongo');

const mongoUrl =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL ||
  'mongodb://127.0.0.1:27017/my_database';

const sessionConfig = {
  secret: process.env.SESSION_SECRET || '123456789',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: mongoUrl
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true
  }
};

module.exports = sessionConfig;
