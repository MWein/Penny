const {
  getOrderInstructionsFromSetting,
  rollProtectivePuts
} = require('./protectivePut')


describe('getOrderInstructionsFromSetting', () => {
  let mockSetting

  beforeEach(() => {
    mockSetting = {
      symbol: 'AAPL',
      enabled: true,
      number: 1,
      frequency: 'weekly',
      targetDelta: 0.3,
      rollIfNegative: false,
      minimumTimeToLive: 45,
      minimumAge: 180,
    }

    // TODO Mock network funcs
  })

  it('Returns empty array if setting.enabled is false', async () => {
    mockSetting.enabled = false
    const orders = await getOrderInstructionsFromSetting([], mockSetting)
    expect(orders).toEqual([])
    // TODO Expect that none of the network funcs were called
  })

  it('Returns empty array if setting.number is 0', async () => {
    mockSetting.number = 0
    const orders = await getOrderInstructionsFromSetting([], mockSetting)
    expect(orders).toEqual([])
    // TODO Expect that none of the network funcs were called
  })

  it('Returns empty array if frequency is "weekly" but its not friday', async () => {

  })

  it('Returns empty array if frequency is "monthly" but none are 30 days old', async () => {

  })
})