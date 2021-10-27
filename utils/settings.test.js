const {
  getSetting,
  getSettings,
} = require('./settings')

describe('getSetting', () => {
  it('Returns a setting', async () => {
    const someSetting = await getSetting('putsEnabled')
    expect(someSetting).toEqual(true)
  })
})

describe('getSettings', () => {
  it('Returns all settings', async () => {
    const settings = await getSettings()
    expect(settings).toEqual({
      callsEnabled: true,
      putsEnabled: true,
      maxAllocation: 4000,
      reserve: 0,
      buyToCloseAmount: 1,
    })
  })
})