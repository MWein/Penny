const mongoose = require('mongoose')

const LogSchema = mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  type: {
    type: String,
    required: true,
    enum: [ 'info', 'ping', 'error' ],
    default: 'info',
  },
  message: {
    type: String,
    required: true,
  },
})

module.exports = mongoose.model('log', LogSchema)