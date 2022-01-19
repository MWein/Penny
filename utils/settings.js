const settingSchema = require('../db_models/settingSchema')

const defaultSettings = {
  callsEnabled: true,
  putsEnabled: true,
  closeExpiringPuts: false,
  reserve: 0, // Money that Penny shouldn't touch. BuyingPower - Reserve. For planned withdrawals.
  profitTarget: 0.75, // Profit to set Buy-To-Close orders to
  priorityList: []
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