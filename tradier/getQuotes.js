const networkUtil = require('../utils/network')


const getQuotes = async tickers => {
  if (tickers.length === 0) {
    return []
  }

  const url = `markets/quotes?symbols=${tickers.join(',')}`
  const response = await networkUtil.get(url)
  if (response.quotes === 'null') {
    return []
  }
  if (Array.isArray(response.quotes.quote)) {
    return response.quotes.quote
  } else {
    return [ response.quotes.quote ]
  }
}


module.exports = {
  getQuotes,
}