const settingSchema = require('../db_models/settingSchema')

const defaultSettings = {
  callsEnabled: true,
  putsEnabled: true,
  maxAllocation: 4000, // The maximum amount of money to put down on a single ticker
  maxPositions: 5, // The maximum number of positions any one position can have
  reserve: 0, // Money that Penny shouldn't touch. BuyingPower - Reserve. For planned withdrawals.
  buyToCloseAmount: 0.01, // Limit price when making automated buy_to_close orders
}

const getSettings = async () => {
  try {
    const mongoSettings = await settingSchema.find()

    // Replace default settings if needed
    const settings = mongoSettings.reduce((acc, setting) => (
      {
        ...acc,
        [setting.key]: setting.value
      }
    ), defaultSettings)
  
    return settings
  } catch (e) {
    return defaultSettings
  }
}

const getSetting = async key => {
  try {
    const mongoSetting = await settingSchema.findOne({ key })
    return mongoSetting === null ? defaultSettings[key] : mongoSetting.value
  } catch (e) {
    return defaultSettings[key]
  }
}

module.exports = {
  defaultSettings,
  getSetting,
  getSettings,
}