const network = require('../utils/network')

const getGainLoss = async () => {
  const url = `accounts/${process.env.ACCOUNTNUM}/gainloss`
  const response = await network.get(url)
  if (response.gainloss === 'null') {
    return []
  }
  if (Array.isArray(response.gainloss.closed_position)) {
    return response.gainloss.closed_position
  } else {
    return [ response.gainloss.closed_position ]
  }
}

module.exports = {
  getGainLoss
}