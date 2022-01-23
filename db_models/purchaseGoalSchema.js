const mongoose = require('mongoose')

const PurchaseGoalSchema = mongoose.Schema({
  symbol: {
    type: String,
    required: true,
  },
  priority: {
    type: Number,
    required: true,
    default: 0, // Higher the number, higher the priority
  },
  goal: {
    type: Number,
    required: true,
  },
  fulfilled: {
    type: Number,
    required: true,
    default: 0,
  }
})

module.exports = mongoose.model('purchaseGoal', PurchaseGoalSchema)