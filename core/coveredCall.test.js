const positions = require('../tradier/getPositions')
const orders = require('../tradier/getOrders')
const bestOption = require('../tradier/selectBestOption')
const sendOrders = require('../tradier/sendOrders')
const settings = require('../utils/settings')
const market = require('../tradier/market')
const logUtil = require('../utils/log')
const costBasisUtil = require('../utils/determineCostBasis')
const watchlistUtil = require('../utils/watchlist')
const {
  _generatePermittedPositionsArray,
  _determineCoverableTickers,
  _getMinimumStrike,
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
      generateOrderObject('TSLA', -1, 'call', 'sell_to_open', 'pending'),
      generateOrderObject('AAPL', -1, 'call', 'sell_to_open', 'pending'),
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


describe('_getMinimumStrike', () => {
  beforeEach(() => {
    costBasisUtil.determineCostBasisPerShare = jest.fn()
  })

  it('Returns null if minStrikeMode is off', async () => {
    const stockSettings = {
      symbol: 'AAPL',
      call: {
        minStrikeMode: 'off',
        minStrike: 34,
      }
    }
    const strike = await _getMinimumStrike(null, stockSettings)
    expect(strike).toEqual(null)
    expect(costBasisUtil.determineCostBasisPerShare).not.toHaveBeenCalled()
  })

  it('Returns the custom strike from the settings if minStrikeMode is custom', async () => {
    const stockSettings = {
      symbol: 'AAPL',
      call: {
        minStrikeMode: 'custom',
        minStrike: 34,
      }
    }
    const strike = await _getMinimumStrike(null, stockSettings)
    expect(strike).toEqual(34)
    expect(costBasisUtil.determineCostBasisPerShare).not.toHaveBeenCalled()
  })

  it('Returns last costPerShare if minStrikeMode is auto, and costPerShare is available', async () => {
    const position = {
      symbol: 'AAPL',
      quantity: 5,
      costPerShare: 50,
    }
    costBasisUtil.determineCostBasisPerShare.mockReturnValue(78)
    const stockSettings = {
      symbol: 'AAPL',
      call: {
        minStrikeMode: 'auto',
        minStrike: 34,
      }
    }
    const strike = await _getMinimumStrike(position, stockSettings)
    expect(strike).toEqual(50)
    expect(costBasisUtil.determineCostBasisPerShare).not.toHaveBeenCalled()
  })

  it('Returns last costPerShare if minStrikeMode is auto, and costPerShare is 0 because Tradier sucks', async () => {
    const position = {
      symbol: 'AAPL',
      quantity: 5,
      costPerShare: 0,
    }
    costBasisUtil.determineCostBasisPerShare.mockReturnValue(78)
    const stockSettings = {
      symbol: 'AAPL',
      call: {
        minStrikeMode: 'auto',
        minStrike: 34,
      }
    }
    const strike = await _getMinimumStrike(position, stockSettings)
    expect(strike).toEqual(78)
    expect(costBasisUtil.determineCostBasisPerShare).toHaveBeenCalledWith('AAPL')
  })
})


describe('sellCoveredCalls', () => {
  beforeEach(() => {
    bestOption.selectBestOption = jest.fn()
    positions.getPositions = jest.fn()
    orders.getOrders = jest.fn()
    sendOrders.sellToOpen = jest.fn()
    settings.getSetting = jest.fn().mockReturnValue(true) // Return true for callsEnabled setting
    market.isMarketOpen = jest.fn().mockReturnValue(true)
    logUtil.log = jest.fn()
    costBasisUtil.determineCostBasisPerShare = jest.fn()
    watchlistUtil.getWatchlist = jest.fn()
  })

  it('Catches and logs exceptions', async () => {
    market.isMarketOpen.mockImplementation(() => {
      throw new Error('Oh nooooooo!')
    })
    await sellCoveredCalls()
    expect(logUtil.log).toHaveBeenCalledWith({
      type: 'error',
      message: 'Error: Oh nooooooo!'
    })
  })

  it('Does not run if callsEnabled setting is false', async () => {
    settings.getSetting.mockReturnValue(false)
    await sellCoveredCalls()
    expect(settings.getSetting).toHaveBeenCalledWith('callsEnabled')
    expect(logUtil.log).toHaveBeenCalledWith('Calls Disabled')
    expect(bestOption.selectBestOption).not.toHaveBeenCalled()
    expect(positions.getPositions).not.toHaveBeenCalled()
    expect(orders.getOrders).not.toHaveBeenCalled()
    expect(sendOrders.sellToOpen).not.toHaveBeenCalled()
    expect(watchlistUtil.getWatchlist).not.toHaveBeenCalled()
  })

  it('Does not run if market is closed', async () => {
    market.isMarketOpen.mockReturnValue(false)
    await sellCoveredCalls()
    expect(settings.getSetting).toHaveBeenCalledWith('callsEnabled')
    expect(logUtil.log).toHaveBeenCalledWith('Market Closed')
    expect(bestOption.selectBestOption).not.toHaveBeenCalled()
    expect(positions.getPositions).not.toHaveBeenCalled()
    expect(orders.getOrders).not.toHaveBeenCalled()
    expect(sendOrders.sellToOpen).not.toHaveBeenCalled()
    expect(watchlistUtil.getWatchlist).not.toHaveBeenCalled()
  })

  it('If the opportunity array is empty, do nothing', async () => {
    positions.getPositions.mockReturnValue([
      generatePositionObject('AAPL', 99, 'stock', 207.01),
      generatePositionObject('TSLA', 5, 'stock', 1870.70),
    ])
    await sellCoveredCalls()
    expect(logUtil.log).toHaveBeenCalledWith('No Covered Call Opportunities')
    expect(watchlistUtil.getWatchlist).not.toHaveBeenCalled()
    expect(bestOption.selectBestOption).not.toHaveBeenCalled()
  })

  it('For each stock returned, calls selectBestOption and sendOrder', async () => {
    positions.getPositions.mockReturnValue([
      generatePositionObject('AAPL', 100, 'stock', 207.01),
      generatePositionObject('TSLA', 200, 'stock', 1870.70),
    ])
    orders.getOrders.mockReturnValue([])
    watchlistUtil.getWatchlist.mockReturnValue([
      {
        symbol: 'AAPL',
        call: {
          enabled: true,
          targetDelta: 0.50,
          minStrikeMode: 'auto',
        }
      },
      {
        symbol: 'TSLA',
        call: {
          enabled: true,
          targetDelta: 0.70,
          minStrikeMode: 'auto',
        }
      }
    ])
    bestOption.selectBestOption.mockReturnValueOnce({
      symbol: 'AAPL1234C3214'
    })
    bestOption.selectBestOption.mockReturnValueOnce({
      symbol: 'TSLA1234C3214'
    })

    await sellCoveredCalls()
    expect(bestOption.selectBestOption).toHaveBeenCalledTimes(2)
    expect(bestOption.selectBestOption).toHaveBeenCalledWith('AAPL', 'call', 2.07, 0.5)
    expect(bestOption.selectBestOption).toHaveBeenCalledWith('TSLA', 'call', 9.35, 0.7)

    expect(sendOrders.sellToOpen).toHaveBeenCalledTimes(2)
    expect(sendOrders.sellToOpen).toHaveBeenCalledWith('AAPL', 'AAPL1234C3214', 1)
    expect(sendOrders.sellToOpen).toHaveBeenCalledWith('TSLA', 'TSLA1234C3214', 2)

    expect(logUtil.log).toHaveBeenCalledWith('Done')
  })


  it('If a stock is not in the watchlist, skip it', async () => {
    positions.getPositions.mockReturnValue([
      generatePositionObject('AAPL', 100, 'stock', 207.01),
      generatePositionObject('TSLA', 200, 'stock', 1870.70),
    ])
    orders.getOrders.mockReturnValue([])
    watchlistUtil.getWatchlist.mockReturnValue([
      {
        symbol: 'AAPL',
        call: {
          enabled: true,
          targetDelta: 0.30,
          minStrikeMode: 'auto',
        }
      },
    ])
    bestOption.selectBestOption.mockReturnValueOnce({
      symbol: 'AAPL1234C3214'
    })

    await sellCoveredCalls()
    expect(bestOption.selectBestOption).toHaveBeenCalledTimes(1)
    expect(bestOption.selectBestOption).toHaveBeenCalledWith('AAPL', 'call', 2.07, 0.3)

    expect(sendOrders.sellToOpen).toHaveBeenCalledTimes(1)
    expect(sendOrders.sellToOpen).toHaveBeenCalledWith('AAPL', 'AAPL1234C3214', 1)

    expect(logUtil.log).toHaveBeenCalledWith('Done')
  })


  it('If calls are not enabled for a particular stock, skip it', async () => {
    positions.getPositions.mockReturnValue([
      generatePositionObject('AAPL', 100, 'stock', 207.01),
      generatePositionObject('TSLA', 200, 'stock', 1870.70),
    ])
    orders.getOrders.mockReturnValue([])
    watchlistUtil.getWatchlist.mockReturnValue([
      {
        symbol: 'AAPL',
        call: {
          enabled: false,
          targetDelta: 0.30,
          minStrikeMode: 'auto',
        }
      },
      {
        symbol: 'TSLA',
        call: {
          enabled: true,
          targetDelta: 0.15,
          minStrikeMode: 'auto',
        }
      }
    ])
    bestOption.selectBestOption.mockReturnValueOnce({
      symbol: 'TSLA1234C3214'
    })

    await sellCoveredCalls()
    expect(bestOption.selectBestOption).toHaveBeenCalledTimes(1)
    expect(bestOption.selectBestOption).toHaveBeenCalledWith('TSLA', 'call', 9.35, 0.15)

    expect(sendOrders.sellToOpen).toHaveBeenCalledTimes(1)
    expect(sendOrders.sellToOpen).toHaveBeenCalledWith('TSLA', 'TSLA1234C3214', 2)

    expect(logUtil.log).toHaveBeenCalledWith('Done')
  })


  it('Skips a sell order if bestOption returns a null', async () => {
    positions.getPositions.mockReturnValue([
      generatePositionObject('AAPL', 100, 'stock', 207.01),
    ])
    orders.getOrders.mockReturnValue([])
    watchlistUtil.getWatchlist.mockReturnValue([
      {
        symbol: 'AAPL',
        call: {
          enabled: true,
          targetDelta: 0.35,
          minStrikeMode: 'auto',
        }
      },
    ])

    bestOption.selectBestOption.mockReturnValueOnce(null)

    await sellCoveredCalls()
    expect(bestOption.selectBestOption).toHaveBeenCalledTimes(1)
    expect(bestOption.selectBestOption).toHaveBeenCalledWith('AAPL', 'call', 2.07, 0.35)
    expect(sendOrders.sellToOpen).not.toHaveBeenCalled()

    expect(logUtil.log).toHaveBeenCalledWith('Done')
  })
})