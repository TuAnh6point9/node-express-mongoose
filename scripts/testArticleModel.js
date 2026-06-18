const mongoose = require('mongoose');
const Article = require('../models/article');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/my_database';

async function testValidationError() {
  const invalidArticle = new Article({
    text: 'Short',
    comments: [{ body: 'Great article!' }],
    tags: []
  });

  try {
    await invalidArticle.validate();
    console.log('Validation test failed: invalid article passed validation.');
  } catch (err) {
    console.log('Validation error test passed.');
    Object.values(err.errors).forEach((validationError) => {
      console.log('-', validationError.message);
    });
  }
}

async function testSuccessfulInsert() {
  const validArticle = new Article({
    title: 'Short News',
    text: 'Paris is known for its iconic landmarks like the Eiffel Tower and Louvre.',
    comments: [{ body: 'Great article!' }],
    tags: ['news']
  });

  const savedArticle = await validArticle.save();
  console.log('Insert test passed. Saved article id:', savedArticle._id.toString());
}

async function main() {
  await testValidationError();

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
    await testSuccessfulInsert();
  } catch (err) {
    console.error('MongoDB test failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

main();
