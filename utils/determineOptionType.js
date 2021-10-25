const nums = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

const determineOptionTypeFromSymbol = symbol => {
  const lettersInSymbol = symbol.split('').filter(char => !nums.includes(char))
  const lastChar = lettersInSymbol[lettersInSymbol.length - 1]
  if (lastChar === 'P') {
    return 'put'
  } else if (lastChar === 'C') {
    return 'call'
  }
}

const isOption = symbol => symbol.split('').some(char => nums.includes(char))

module.exports = {
  determineOptionTypeFromSymbol,
  isOption,
}