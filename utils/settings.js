/*
Settings to implement
[X] callsEnabled
[X] putsEnabled
[X] maxAllocation
[ ] reserve
[ ] gtcAmount
*/

const defaultSettings = {
  callsEnabled: true,
  putsEnabled: true,
  maxAllocation: 1000, // The maximum amount of money to put down on a single ticker
  reserve: 0, // Money that Penny shouldn't touch. BuyingPower - Reserve. For planned withdrawals.
  gtcAmount: 1, // Limit price when making automated buy_to_close orders
}

const getSettings = async () => {
  // TODO grab all settings from database

  return defaultSettings
}

const getSetting = async key => {
  // TODO Grab setting from database

  return defaultSettings[key]
}

module.exports = {
  getSetting,
  getSettings,
}