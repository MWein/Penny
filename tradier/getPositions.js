const network = require('../utils/network')

const getPositions = async () => {
  const url = `accounts/${process.env.ACCOUNTNUM}/positions`
  const response = await network.get(url)
  if (response.positions === 'null') {
    return []
  }
  if (Array.isArray(response.positions.position)) {
    return response.positions.position
  } else {
    return [ response.positions.position ]
  }
}

module.exports = {
  getPositions
}