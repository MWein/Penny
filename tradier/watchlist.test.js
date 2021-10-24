const network = require('../utils/network')
const {
  getWatchlistSymbols
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