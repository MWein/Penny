const positionsUtil = require('../tradier/getPositions')
const PositionHistorySchema = require('../db_models/positionHistorySchema')
const { savePositionsCron } = require('./savePositionsCron')


describe('savePositionsCron', () => {
  beforeEach(() => {
    PositionHistorySchema.findOneAndUpdate = jest.fn()
    positionsUtil.getPositions = jest.fn()
  })

  it('Saves position history in the proper format', async () => {
    positionsUtil.getPositions.mockReturnValueOnce([
      {
        id: 1234,
        symbol: 'ZNGA1234P3214',
        date_acquired: '2021-01-01',
        quantity: -7,
        cost_basis: -147,
      },
      {
        id: 4321,
        symbol: 'AAPL1234C3214',
        date_acquired: '2021-01-01',
        quantity: -5,
        cost_basis: -22,
      },
    ])

    await savePositionsCron()

    expect(PositionHistorySchema.findOneAndUpdate).toHaveBeenCalledTimes(2)
    expect(PositionHistorySchema.findOneAndUpdate).toHaveBeenCalledWith(
      { id: 1234 },
      { id: 1234, symbol: 'ZNGA1234P3214', acquired: '2021-01-01', quantity: 7, costBasis: 147 },
      { upsert: true }
    )
    expect(PositionHistorySchema.findOneAndUpdate).toHaveBeenCalledWith(
      { id: 4321 },
      { id: 4321, symbol: 'AAPL1234C3214', acquired: '2021-01-01', quantity: 5, costBasis: 22 },
      { upsert: true }
    )
  })

  it('Filters out non-option positions', async () => {
    positionsUtil.getPositions.mockReturnValueOnce([
      {
        id: 1234,
        symbol: 'ZNGA1234P3214',
        date_acquired: '2021-01-01',
        quantity: -7,
        cost_basis: -147,
      },
      {
        id: 4321,
        symbol: 'AAPL',
        date_acquired: '2021-01-01',
        quantity: -5,
        cost_basis: -22,
      },
    ])

    await savePositionsCron()

    expect(PositionHistorySchema.findOneAndUpdate).toHaveBeenCalledTimes(1)
    expect(PositionHistorySchema.findOneAndUpdate).toHaveBeenCalledWith(
      { id: 1234 },
      { id: 1234, symbol: 'ZNGA1234P3214', acquired: '2021-01-01', quantity: 7, costBasis: 147 },
      { upsert: true }
    )
  })
})