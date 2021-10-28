const network = require('../utils/network')

const isMarketOpen = async () => {
  try {
    const response = await network.get('/markets/clock')
    return response.clock.state === 'open'
  } catch (e) {
    return false
  }
}

module.exports = {
  isMarketOpen
}