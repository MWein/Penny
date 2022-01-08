const nextStrikeDates = require('../utils/nextStrikeDates')
const selectBest = require('./selectBestOptionForDay')


const _selectOptionWithBestWeeklyRate = options => options.length > 0 ? options.reduce((acc, option) =>
  option.weeklyRate > acc.weeklyRate ? option : acc, options[0]
) : null


const _selectOptionWithBestWeeklyPerc = options => {
  if (options.length === 0) {
    return null
  }

  const best = options.reduce((acc, option) => {
    if (option.weeksOut <= 2) {
      option.weeklyPercReturn > acc.weeklyPercReturn ? option : acc, options[0]
    }
  
    // Only consider options more than 2 weeks out if the percent return is 3% or better
    return option.weeklyPercReturn > acc.weeklyPercReturn && option.weeklyPercReturn >= 3 ? option : acc, options[0]
  })

  return best.weeklyPercReturn >= 1 ? best : null
}



const selectBestOption = async (symbol, type, minStrike = null, maxWeeksOut = 4) => {
  const expirationDates = nextStrikeDates(maxWeeksOut)

  // Week is used to calculate the weekly rate
  // Premium / week = weekly rate
  let week = 1
  const options = []

  for (let x = 0; x < expirationDates.length; x++) {
    const expiration = expirationDates[x]
    const bestOption = await selectBest.selectBestStrikeForDay(symbol, type, expiration, minStrike)

    // Skip if best option is empty object
    if (bestOption.symbol) {
      const weeklyRate = (bestOption.premium / week)
      const weeklyPercReturn = Number(((weeklyRate / (bestOption.strike * 100)) * 100).toFixed(3))
      options.push({ ...bestOption, weeklyRate, weeklyPercReturn, weeksOut: week })
    }
    week++
  }

  return _selectOptionWithBestWeeklyPerc(options)
}


module.exports = {
  _selectOptionWithBestWeeklyRate,
  _selectOptionWithBestWeeklyPerc,
  selectBestOption,
}