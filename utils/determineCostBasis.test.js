const historyUtil = require('../tradier/getHistory')
const { determineCostBasisPerShare } = require('./determineCostBasis')


describe('determineCostBasisPerShare', () => {
  beforeEach(() => {
    historyUtil.getTradeHistoryForSymbol = jest.fn()
  })

  it('Returns 0 if no equity trade history is found', async () => {
    historyUtil.getTradeHistoryForSymbol.mockReturnValue([])
    const result = await determineCostBasisPerShare('AAPL')
    expect(historyUtil.getTradeHistoryForSymbol).toHaveBeenCalledWith('AAPL')
    expect(result).toEqual(0)
  })

  it('Returns the trade price for the last equity result returned', async () => {
    historyUtil.getTradeHistoryForSymbol.mockReturnValue([
      {
        trade: {
          trade_type: 'option',
          price: 200
        },
      },
      {
        trade: {
          trade_type: 'equity',
          price: 15
        },
      },
      {
        trade: {
          trade_type: 'equity',
          price: 20
        },
      },
    ])
    const result = await determineCostBasisPerShare('AAPL')
    expect(result).toEqual(15)
  })
})