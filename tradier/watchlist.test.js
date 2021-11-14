const network = require('../utils/network')
const logUtil = require('../utils/log')
const {
  getWatchlistSymbols,
  replaceWatchlist,
} = require('./watchlist')

describe('getWatchlistSymbols', () => {
  beforeEach(() => {
    network.get = jest.fn()
  })
  
  it('Returns empty array if network call fails', async () => {
    network.get.mockImplementationOnce(() => {
      throw new Error('Ope')
    })
    const watchlist = await getWatchlistSymbols()
    expect(watchlist).toEqual([])
  })

  it('Returns an array with one symbol if network call returns an object', async () => {
    network.get.mockReturnValueOnce({
      watchlist: {
        items: {
          item: { symbol: 'AAPL' }
        }
      }
    })
    const watchlist = await getWatchlistSymbols()
    expect(watchlist).toEqual([ 'AAPL' ])
  })

  it('Returns an array if network call returns an array', async () => {
    network.get.mockReturnValueOnce({
      watchlist: {
        items: {
          item: [ { symbol: 'AAPL' } , { symbol: 'TSLA' }]
        }
      }
    })
    const watchlist = await getWatchlistSymbols()
    expect(watchlist).toEqual([ 'AAPL', 'TSLA' ])
  })
})


describe('replaceWatchlist', () => {
  beforeEach(() => {
    network.put = jest.fn()
    logUtil.log = jest.fn()
  })

  it('If given an empty array, does nothing', async () => {
    await replaceWatchlist([])
    expect(network.put).not.toHaveBeenCalled()
  })

  it('On error, logs', async () => {
    network.put.mockImplementationOnce(() => {
      throw new Error('Shit')
    })
    await replaceWatchlist([ 'AAPL', 'TSLA' ])
    expect(logUtil.log).toHaveBeenCalledWith({
      type: 'error',
      message: 'Error updating the watchlist'
    })
  })

  it('Success', async () => {
    await replaceWatchlist([ 'AAPL', 'TSLA' ])
    expect(logUtil.log).not.toHaveBeenCalled()
  })
})