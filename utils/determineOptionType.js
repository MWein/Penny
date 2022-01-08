const nums = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']


const determineOptionTypeFromSymbol = symbol => {
  if (!isOption(symbol)) {
    return 'neither'
  }
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


const getExpiration = symbol =>
  isOption(symbol) ?
    symbol.replace(getUnderlying(symbol), '').split(/C|P/g)[0].split('').reduce((acc, x, index) =>
      [1,3].includes(index) ? acc + x + '-' : acc + x, '20')
    : null


const getStrike = symbol => {
  return isOption(symbol) ?
    Number(symbol.replace(getUnderlying(symbol), '').split(/C|P/g)[1].split('').reduce((acc, x, index) =>
      index === 4 ? acc + x + '.' : acc + x, ''))
    : null
}


module.exports = {
  determineOptionTypeFromSymbol,
  isOption,
  getUnderlying,
  getExpiration,
  getStrike,
}