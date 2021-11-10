const positionsUtil = require('../tradier/getPositions')
const { isOption } = require('./determineOptionType')
const PositionHistorySchema = require('../db_models/positionHistorySchema')


const savePositionsCron = async () => {
  const positions = await positionsUtil.getPositions()
  const optionPositions = positions.filter(x => isOption(x.symbol))
    .map(x => ({
      id: x.id,
      symbol: x.symbol,
      acquired: x.date_acquired,
      quantity: x.quantity * -1,
      costBasis: x.cost_basis * -1,
    }))

  // Upsert position
  optionPositions.map(async x => {
    await PositionHistorySchema.findOneAndUpdate({ id: x.id }, x, { upsert: true })
  })
}

module.exports = {
  savePositionsCron
}