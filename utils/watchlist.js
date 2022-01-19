const watchlistSchema = require('../db_models/watchlistSchema')

const getWatchlist = async () => {
  try {
    const watchlist = await watchlistSchema.find()
    return watchlist.map(x => x._doc)
  } catch (e) {
    return []
  }
}

module.exports = {
  getWatchlist
}