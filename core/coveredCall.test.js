const positions = require('../tradier/getPositions')
const orders = require('../tradier/getOrders')
const bestOption = require('../tradier/selectBestOption')
const sendOrders = require('../tradier/sendOrders')
const settings = require('../utils/settings')
const {
  _generatePermittedPositionsArray,
  _determineCoverableTickers,
  sellCoveredCalls,
} = require('./coveredCall')

const {
  generateOrderObject,
  generatePositionObject,
} = require('../utils/testHelpers')


describe('_generatePermittedPositionsArray', () => {
  it('Returns empty array if there are no optionable stocks', () => {
    const optionableStocks = []
    const currentOptions = []
    const pendingOptions = []
    const map = _generatePermittedPositionsArray(optionableStocks, currentOptions, pendingOptions)
    expect(map).toEqual([])
  })

  it('Returns array of stocks with their permitted call number; no current or pending options', () => {
    const optionableStocks = [
      generatePositionObject('AAPL', 100, 'stock', 207.01),
      generatePositionObject('AMZN', 120, 'stock', 1870.70),
      generatePositionObject('CAH', 203, 'stock', 50.41),
      generatePositionObject('FB', 20, 'stock', 50.41),
    ]
    const currentOptions = []
    const pendingOptions = []
    const result = _generatePermittedPositionsArray(optionableStocks, currentOptions, pendingOptions)
    expect(result).toEqual([
      {
        symbol: 'AAPL',
        quantity: 1,
        costPerShare: 2.07,
      },
      {
        symbol: 'AMZN',
        quantity: 1,
        costPerShare: 15.59
      },
      {
        symbol: 'CAH',
        quantity: 2,
        costPerShare: 0.25
      },
    ])
  })

  it('Returns array of stocks with their permitted call number; no pending options', () => {
    const optionableStocks = [
      generatePositionObject('AAPL', 100, 'stock', 207.01),
      generatePositionObject('AMZN', 120, 'stock', 1870.70),
      generatePositionObject('CAH', 203, 'stock', 50.41),
      generatePositionObject('FB', 20, 'stock', 50.41),
    ]
    const currentOptions = [
      generatePositionObject('CAH', -1, 'call', 50.41),
      generatePositionObject('AAPL', -1, 'call', 50.41),
    ]
    const pendingOptions = []
    const result = _generatePermittedPositionsArray(optionableStocks, currentOptions, pendingOptions)
    expect(result).toEqual([
      {
        symbol: 'AMZN',
        quantity: 1,
        costPerShare: 15.59,
      },
      {
        symbol: 'CAH',
        quantity: 1,
        costPerShare: 0.25,
      },
    ])
  })

  it('Returns array of stocks with permitted call number; no current options; handles multiple options orders with the same underlying', () => {
    const optionableStocks = [
      generatePositionObject('AAPL', 100, 'stock', 207.01),
      generatePositionObject('AMZN', 120, 'stock', 1870.70),
      generatePositionObject('CAH', 203, 'stock', 50.41),
      generatePositionObject('FB', 20, 'stock', 50.41),
    ]
    const currentOptions = []
    const pendingOptions = [
      generateOrderObject('AAPL', 1, 'call', 'sell_to_open', 'pending'),
      generateOrderObject('CAH', 1, 'call', 'sell_to_open', 'pending'),
      generateOrderObject('CAH', 1, 'call', 'sell_to_open', 'pending'),
    ]
    const result = _generatePermittedPositionsArray(optionableStocks, currentOptions, pendingOptions)
    expect(result).toEqual([
      {
        symbol: 'AMZN',
        quantity: 1,
        costPerShare: 15.59,
      },
    ])
  })

  it('Returns array of stocks with permitted call number', () => {
    const optionableStocks = [
      generatePositionObject('AAPL', 100, 'stock', 207.01),
      generatePositionObject('AMZN', 120, 'stock', 1870.70),
      generatePositionObject('CAH', 203, 'stock', 50.41),
      generatePositionObject('FB', 20, 'stock', 50.41),
    ]
    const currentOptions = [
      generatePositionObject('AMZN', -1, 'call', 50.41),
    ]
    const pendingOptions = [
      generateOrderObject('AAPL', 1, 'call', 'sell_to_open', 'pending'),
      generateOrderObject('CAH', 2, 'call', 'sell_to_open', 'pending'),
    ]
    const result = _generatePermittedPositionsArray(optionableStocks, currentOptions, pendingOptions)
    expect(result).toEqual([])
  })
})


describe('_determineCoverableTickers', () => {
  beforeEach(() => {
    positions.getPositions = jest.fn()
    orders.getOrders = jest.fn()
  })

  it('Returns empty array if there are no optionable positions', async () => {
    positions.getPositions.mockReturnValue([
      generatePositionObject('AAPL', 99, 'stock', 201.01),
      generatePositionObject('TSLA', 5, 'stock', 1870.70),
    ])
    const status = await _determineCoverableTickers()
    expect(status).toEqual([])
  })

  it('Returns empty array if the position map comes up all zeros', async () => {
    positions.getPositions.mockReturnValue([
      generatePositionObject('AAPL', 100, 'stock', 207.01),
      generatePositionObject('TSLA', 200, 'stock', 1870.70),
      generatePositionObject('TSLA', -1, 'call', 1870.70),
    ])
    orders.getOrders.mockReturnValue([
      generateOrderObject('TSLA', 1, 'call', 'sell_to_open', 'pending'),
      generateOrderObject('AAPL', 1, 'call', 'sell_to_open', 'pending'),
    ])
    const result = await _determineCoverableTickers()
    expect(result).toEqual([])
  })

  it('Returns list of coverable tickers', async () => {
    positions.getPositions.mockReturnValue([
      generatePositionObject('AAPL', 100, 'stock', 207.01),
      generatePositionObject('TSLA', 200, 'stock', 1870.70),
      generatePositionObject('TSLA', -1, 'call', 1870.70),
    ])
    orders.getOrders.mockReturnValue([
      generateOrderObject('AAPL', 1, 'call', 'sell_to_open', 'pending'),
    ])
    const result = await _determineCoverableTickers()
    expect(result).toEqual([
      {
        symbol: 'TSLA',
        quantity: 1,
        costPerShare: 9.35,
      },
    ])
  })

  it('Ignores put option positions', async () => {
    positions.getPositions.mockReturnValue([
      generatePositionObject('AAPL', 100, 'stock', 207.01),
      generatePositionObject('TSLA', 200, 'stock', 1870.70),
      generatePositionObject('TSLA', -1, 'call', 1870.70),
      generatePositionObject('TSLA', -1, 'put', 1870.70),
    ])
    orders.getOrders.mockReturnValue([
      generateOrderObject('AAPL', 1, 'call', 'sell_to_open', 'pending'),
    ])
    const result = await _determineCoverableTickers()
    expect(result).toEqual([
      {
        symbol: 'TSLA',
        quantity: 1,
        costPerShare: 9.35,
      },
    ])
  })

  it('Ignores buy-to-close orders', async () => {
    positions.getPositions.mockReturnValue([
      generatePositionObject('AAPL', 100, 'stock', 207.01),
      generatePositionObject('TSLA', 200, 'stock', 1870.70),
      generatePositionObject('TSLA', -1, 'call', 1870.70),
      generatePositionObject('TSLA', -1, 'put', 1870.70),
    ])
    orders.getOrders.mockReturnValue([
      generateOrderObject('AAPL', 1, 'call', 'sell_to_open', 'pending'),
      generateOrderObject('TSLA', 1, 'call', 'buy_to_close', 'pending'),
    ])
    const result = await _determineCoverableTickers()
    expect(result).toEqual([
      {
        symbol: 'TSLA',
        quantity: 1,
        costPerShare: 9.35,
      },
    ])
  })
})


describe('sellCoveredCalls', () => {
  beforeEach(() => {
    bestOption.selectBestOption = jest.fn()
    positions.getPositions = jest.fn()
    orders.getOrders = jest.fn()
    sendOrders.sellToOpen = jest.fn()
    settings.getSetting = jest.fn().mockReturnValue(true) // Return true for callsEnabled setting
  })

  it('Does not run if callsEnabled setting is false', async () => {
    settings.getSetting.mockReturnValue(false)
    await sellCoveredCalls()
    expect(settings.getSetting).toHaveBeenCalledWith('callsEnabled')
    expect(bestOption.selectBestOption).not.toHaveBeenCalled()
    expect(positions.getPositions).not.toHaveBeenCalled()
    expect(orders.getOrders).not.toHaveBeenCalled()
    expect(sendOrders.sellToOpen).not.toHaveBeenCalled()
  })

  it('If the opportunity array is empty, do nothing', async () => {
    positions.getPositions.mockReturnValue([
      generatePositionObject('AAPL', 99, 'stock', 207.01),
      generatePositionObject('TSLA', 5, 'stock', 1870.70),
    ])
    await sellCoveredCalls()
    expect(bestOption.selectBestOption).not.toHaveBeenCalled()
  })

  it('For each stock returned, calls selectBestOption and sendOrder', async () => {
    positions.getPositions.mockReturnValue([
      generatePositionObject('AAPL', 100, 'stock', 207.01),
      generatePositionObject('TSLA', 200, 'stock', 1870.70),
    ])
    orders.getOrders.mockReturnValue([])

    bestOption.selectBestOption.mockReturnValueOnce({
      symbol: 'AAPL1234C3214'
    })
    bestOption.selectBestOption.mockReturnValueOnce({
      symbol: 'TSLA1234C3214'
    })

    await sellCoveredCalls()
    expect(bestOption.selectBestOption).toHaveBeenCalledTimes(2)
    expect(bestOption.selectBestOption).toHaveBeenCalledWith('AAPL', 'call', 2.07)
    expect(bestOption.selectBestOption).toHaveBeenCalledWith('TSLA', 'call', 9.35)

    expect(sendOrders.sellToOpen).toHaveBeenCalledTimes(2)
    expect(sendOrders.sellToOpen).toHaveBeenCalledWith('AAPL', 'AAPL1234C3214', 1)
    expect(sendOrders.sellToOpen).toHaveBeenCalledWith('TSLA', 'TSLA1234C3214', 2)
  })

  it('Skips a sell order if bestOption returns a null', async () => {
    positions.getPositions.mockReturnValue([
      generatePositionObject('AAPL', 100, 'stock', 207.01),
    ])
    orders.getOrders.mockReturnValue([])

    bestOption.selectBestOption.mockReturnValueOnce(null)

    await sellCoveredCalls()
    expect(bestOption.selectBestOption).toHaveBeenCalledTimes(1)
    expect(bestOption.selectBestOption).toHaveBeenCalledWith('AAPL', 'call', 2.07)
    expect(sendOrders.sellToOpen).not.toHaveBeenCalled()
  })
})