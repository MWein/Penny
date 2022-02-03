const mongoose = require('mongoose')

const ProtectivePutSchema = mongoose.Schema({
  symbol: {
    type: String,
    required: true,
  },
  enabled: {
    type: Boolean,
    required: true,
    default: true,
  },
  number: {
    type: Number,
    required: true,
    default: 1
  },
  frequency: {
    type: String,
    required: true,
    default: 'weekly',
    enum: [ 'daily', 'weekly', 'monthly' ]
  },
  targetDelta: {
    type: Number,
    required: true,
    default: 0.3,
    min: [0.1],
    max: [1]
  },
  rollIfNegative: {
    type: Boolean,
    required: true,
    default: false,
  },
  minimumTimeToLive: {
    type: Number,
    required: true,
    default: 45
  },
  minimumAge: {
    type: Number,
    required: true,
    default: 180,
  }
})

module.exports = mongoose.model('protectivePut', ProtectivePutSchema)