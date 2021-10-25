const nums = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

const determineOptionTypeFromSymbol = symbol => {
  const lettersInSymbol = symbol.split('').filter(char => !nums.includes(char))
  const lastChar = lettersInSymbol[lettersInSymbol.length - 1]
  if (lastChar === 'P') {
    return 'put'
  } else {
    return 'call'
  }
}

const isOption = symbol => symbol.split('').some(char => nums.includes(char))

const getUnderlying = symbol =>
  isOption(symbol) ? symbol.split('').filter(char => !nums.includes(char)).slice(0, -1).join('') : symbol

module.exports = {
  determineOptionTypeFromSymbol,
  isOption,
  getUnderlying,
}