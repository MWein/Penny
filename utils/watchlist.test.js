const watchlistSchema = require('../db_models/watchlistSchema')

const {
  getWatchlist
} = require('./watchlist')


describe('getWatchlist', () => {
  beforeEach(() => {
    watchlistSchema.find = jest.fn()
  })

  it('Returns empty array if schema throws', async () => {
    watchlistSchema.find.mockImplementation(() => {
      throw new Error('Damn')
    })
    const watchlist = await getWatchlist()
    expect(watchlist).toEqual([])
  })

  it('Returns watchlist from DB', async () => {
    watchlistSchema.find.mockReturnValue([
      {
        symbol: 'stonk',
        some: 'settings',
      },
      {
        symbol: 'AAPL',
        some: 'moresettings',
      },
    ])
    const watchlist = await getWatchlist()
    expect(watchlist).toEqual([
      {
        symbol: 'stonk',
        some: 'settings',
      },
      {
        symbol: 'AAPL',
        some: 'moresettings',
      },
    ])
  })
})
