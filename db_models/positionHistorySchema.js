const mongoose = require('mongoose')

const PositionHistorySchema = mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  symbol: {
    type: String,
    required: true,
  },
  acquired: {
    type: Date,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  costBasis: {
    type: Number,
    required: true,
  }
})

module.exports = mongoose.model('positionHistory', PositionHistorySchema)