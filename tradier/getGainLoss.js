const network = require('../utils/network')

const getGainLoss = async (pageNum = 1) => {
  const url = `accounts/${process.env.ACCOUNTNUM}/gainloss?page=${pageNum}`
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