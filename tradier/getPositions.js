const { isOption, determineOptionTypeFromSymbol } = require('../utils/determineOptionType')
const network = require('../utils/network')


const filterForOptionableStockPositions = positions =>
  positions.filter(pos => !isOption(pos.symbol) && pos.quantity >= 100)

const filterForShortPutPositions = positions =>
  positions.filter(pos => determineOptionTypeFromSymbol(pos.symbol) === 'put' && pos.quantity < 0)

const filterForShortCallPositions = positions =>
  positions.filter(pos => determineOptionTypeFromSymbol(pos.symbol) === 'call' && pos.quantity < 0)


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
  filterForOptionableStockPositions,
  filterForShortPutPositions,
  filterForShortCallPositions,
  getPositions
}