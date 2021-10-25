const determineOptionTypeFromSymbol = symbol => {
  const nums = '1234567890'.split('')
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