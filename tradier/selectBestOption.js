const nextStrikeDates = require('../utils/nextStrikeDates')
const selectBest = require('./selectBestOptionForDay')


const _selectOptionWithBestWeeklyRate = options => options.length > 0 ? options.reduce((acc, option) =>
  option.weeklyRate > acc.weeklyRate ? option : acc, options[0]
) : null


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
      const weeklyRate = bestOption.premium / week
      options.push({ ...bestOption, weeklyRate })
    }
    week++
  }

  return _selectOptionWithBestWeeklyRate(options)
}


module.exports = {
  _selectOptionWithBestWeeklyRate,
  selectBestOption,
}