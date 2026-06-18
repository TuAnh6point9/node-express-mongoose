const cors = require('cors');

const whitelist = [
  'http://localhost:3000',
  'https://localhost:3002',
  'http://localhost:3002',
  'https://localhost:3000'
];

const corsOptionsDelegate = (req, callback) => {
  let corsOptions;
  if (whitelist.indexOf(req.header('Origin')) !== -1) {
    corsOptions = { origin: true, optionsSuccessStatus: 200 };
  } else {
    corsOptions = { origin: false };
  }
  callback(null, corsOptions);
};

exports.cors = cors();
exports.corsWithOptions = cors(corsOptionsDelegate);
