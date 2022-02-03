

const getOrderInstructionsFromSetting = (currentProtectivePuts, protectivePutSetting) => {
  const {
    symbol,
    enabled,
    number,
    frequency,
    targetDelta,
    rollIfNegative,
    minimumTimeToLive,
    minimumAge,
  } = protectivePutSetting

  if (!enabled) {
    return []
  }

  if (number === 0) {
    return []
  }

  // Filter out currentProtectivePuts for those with symbol

  // Check if current date works with frequency
  if (frequency === 'weekly') {
    // Check if its friday
    // If not, return
  }

  if (frequency === 'monthly') {
    // Check if current positions is older than or equal to 30 days
    // If not, return
  }

  // Filter out positions that are less than a month old, if freq is monthly

  // Create phantom positions if 'number' is greater than the number that we currently have
  // NOTE: Do not create phantom position for less-than-month-old puts if frequency is "monthly"

  // Phantom positions will have a strike of 0, so they are guarenteed to be replaced

  // If 'number' is less than the number we currently have, remove the older ones from play



  // Get expirations for symbol
  // Pick first expiration older than minimum age

  // Get the options expiring that day

  // Pick the one closest to targetDelta

  // Loop through each open positions, including phantom positions
  // If the new option has a strike higher than open position or rollIfNegative is true, create replacement orders

  // Return the replacement orders
}


const rollProtectivePuts = () => {
  // Get settings
  // If protectivePuts is disabled, return and do nothing

  // If market is closed, return and do nothing

  // Get protective put settings from DB
  // If none, return and do nothing

  // Get all current protective puts

  // call getOrderInstructionsFromSetting for each setting

  // Sort so that sell orders are first


}



module.exports = {
  getOrderInstructionsFromSetting,
  rollProtectivePuts
}