const mongoose = require('mongoose');
const { Schema } = mongoose;

const articleSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Article title is required.'], // Value-level validation
    minlength: [5, 'Title must be at least 5 characters.'], // String-level validation
    trim: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: [true, 'Article date is required.']
  },
  text: {
    type: String,
    required: [true, 'Article text is required.'],
    validate: {
      validator: function(v) {
        return typeof v === 'string' && v.length > 10;
      },
      message: 'Article text must be longer than 10 characters.'
    }
  },
  comments: [{
    body: {
      type: String,
      required: [true, 'Comment body is required.']
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  tags: {
    type: [String],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'There should be at least 1 tag.'
    }
  }
});

const Article = mongoose.models.Article || mongoose.model('Article', articleSchema);
module.exports = Article;
