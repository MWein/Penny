const settingSchema = require('../db_models/settingSchema')

const {
  defaultSettings,
  getSetting,
  getSettings,
} = require('./settings')

describe('getSetting', () => {
  beforeEach(() => {
    settingSchema.findOne = jest.fn()
  })

  it('Returns a default setting if findOne throws', async () => {
    settingSchema.findOne.mockImplementation(() => {
      throw new Error('Damn')
    })
    const result = await getSetting('reserve')
    expect(result).toEqual(defaultSettings.reserve)
  })

  it('Returns a default setting if Mongo doesnt have it', async () => {
    settingSchema.findOne.mockReturnValue(null)
    const result = await getSetting('reserve')
    expect(result).toEqual(defaultSettings.reserve)
  })

  it('Returns setting from mongo', async () => {
    settingSchema.findOne.mockReturnValue({ key: 'reserve', value: 20 })
    const result = await getSetting('reserve')
    expect(result).toEqual(20)
  })
})


describe('getSettings', () => {
  beforeEach(() => {
    settingSchema.find = jest.fn()
  })

  it('Returns default settings if find throws', async () => {
    settingSchema.find.mockImplementation(() => {
      throw new Error('Damn')
    })
    const result = await getSettings()
    expect(result).toEqual(defaultSettings)
  })

  it('Returns defaults for whatever is not in Mongo', async () => {
    settingSchema.find.mockReturnValue([
      {
        key: 'callsEnabled',
        value: false,
      },
      {
        key: 'reserve',
        value: 20,
      }
    ])
    const result = await getSettings()
    expect(result).toEqual({
      ...defaultSettings,
      callsEnabled: false,
      reserve: 20,
    })
  })

  it('Returns from Mongo', async () => {
    settingSchema.find.mockReturnValue([
      {
        key: 'callsEnabled',
        value: false,
      },
      {
        key: 'putsEnabled',
        value: false,
      },
      {
        key: 'closeExpiringPuts',
        value: true,
      },
      {
        key: 'reserve',
        value: 20,
      },
      {
        key: 'profitTarget',
        value: 0.70
      },
      {
        key: 'priorityList',
        value: [ 'AAPL', 'MSFT' ],
      },
    ])
    const result = await getSettings()
    expect(result).toEqual({
      callsEnabled: false,
      putsEnabled: false,
      closeExpiringPuts: true,
      reserve: 20,
      profitTarget: 0.70,
      priorityList: [ 'AAPL', 'MSFT' ]
    })
  })

  it('Returns defaults if Mongo is empty', async () => {
    settingSchema.find.mockReturnValue([])
    const result = await getSettings()
    expect(result).toEqual(defaultSettings)
  })
})