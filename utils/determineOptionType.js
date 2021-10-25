const determineOptionTypeFromSymbol = symbol => {
  const nums = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
  const lettersInSymbol = symbol.split('').filter(char => !nums.includes(char))
  const lastChar = lettersInSymbol[lettersInSymbol.length - 1]
  if (lastChar === 'P') {
    return 'put'
  } else if (lastChar === 'C') {
    return 'call'
  }
}

module.exports = {
  determineOptionTypeFromSymbol,
}