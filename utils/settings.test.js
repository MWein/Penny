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
    const result = await getSetting('buyToCloseAmount')
    expect(result).toEqual(defaultSettings.buyToCloseAmount)
  })

  it('Returns a default setting if Mongo doesnt have it', async () => {
    settingSchema.findOne.mockReturnValue(null)
    const result = await getSetting('buyToCloseAmount')
    expect(result).toEqual(defaultSettings.buyToCloseAmount)
  })

  it('Returns setting from mongo', async () => {
    settingSchema.findOne.mockReturnValue({ key: 'buyToCloseAmount', value: 20 })
    const result = await getSetting('buyToCloseAmount')
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
        key: 'maxAllocation',
        value: 40000,
      },
      {
        key: 'reserve',
        value: 20,
      },
      {
        key: 'buyToCloseAmount',
        value: 80,
      },
      {
        key: 'maxPositions',
        value: 6,
      }
    ])
    const result = await getSettings()
    expect(result).toEqual({
      callsEnabled: false,
      putsEnabled: false,
      maxAllocation: 40000,
      maxPositions: 6,
      reserve: 20,
      buyToCloseAmount: 80,
    })
  })
})