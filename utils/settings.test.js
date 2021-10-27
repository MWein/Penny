const settingSchema = require('../db_models/settingSchema')

const {
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
    expect(result).toEqual(1)
  })

  it('Returns a default setting if Mongo doesnt have it', async () => {
    settingSchema.findOne.mockReturnValue(null)
    const result = await getSetting('buyToCloseAmount')
    expect(result).toEqual(1)
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
    expect(result).toEqual({
      callsEnabled: true,
      putsEnabled: true,
      maxAllocation: 4000,
      reserve: 0,
      buyToCloseAmount: 1,
    })
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
      callsEnabled: false,
      putsEnabled: true,
      maxAllocation: 4000,
      reserve: 20,
      buyToCloseAmount: 1,
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
    ])
    const result = await getSettings()
    expect(result).toEqual({
      callsEnabled: false,
      putsEnabled: false,
      maxAllocation: 40000,
      reserve: 20,
      buyToCloseAmount: 80,
    })
  })
})