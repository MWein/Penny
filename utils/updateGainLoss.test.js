const gainLossUtil = require('../tradier/getGainLoss')
const logUtil = require('./log')
const gainLossSchema = require('../db_models/gainLossSchema')
jest.mock('../db_models/gainLossSchema')

const {
  _findOrInsertRecord,
  updateGainLossCollection,
} = require('./updateGainLoss')


describe('_findOrInsertRecord', () => {
  let saveFunc

  beforeEach(() => {
    saveFunc = jest.fn()
    gainLossSchema.mockReturnValue({
      save: saveFunc,
    })
    gainLossSchema.findOne = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('On failure, returns false', async () => {
    gainLossSchema.findOne.mockImplementation(() => {
      throw new Error('Damn it')
    })
    const result = await _findOrInsertRecord({ some: 'record' })
    expect(result).toEqual(false)
  })

  it('If record is found, does not create new record and returns false', async () => {
    gainLossSchema.findOne.mockReturnValue({
      some: 'record'
    })
    const result = await _findOrInsertRecord({ some: 'record' })
    expect(gainLossSchema.findOne).toHaveBeenCalledWith({ hashId: '37455f1a855e21986679cda5b72c4e19c632cb93eb444f6c52c5fe005b291244' })
    expect(result).toEqual(false)
    expect(saveFunc).not.toHaveBeenCalled()
  })

  it('If record is not found, creates new record and returns true', async () => {
    gainLossSchema.findOne.mockReturnValue(null)
    const result = await _findOrInsertRecord({ some: 'otherrecord' })
    expect(gainLossSchema).toHaveBeenCalledWith({ hashId: '2d193b4a7e52d701ba7b6331ec59ff5dd477fe732237a98faa17f1d85ced21c4', some: 'otherrecord' })
    expect(saveFunc).toHaveBeenCalled()
    expect(result).toEqual(true)
  })
})


describe('updateGainLossCollection', () => {
  let saveFunc

  beforeEach(() => {
    saveFunc = jest.fn()
    gainLossSchema.mockReturnValue({
      save: saveFunc,
    })
    gainLossSchema.findOne = jest.fn()

    gainLossUtil.getGainLoss = jest.fn()
    logUtil.log = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('Calls first page. Does nothing if getGainLoss returns empty array', async () => {
    gainLossUtil.getGainLoss.mockReturnValue([])
    await updateGainLossCollection()
    expect(logUtil.log).toHaveBeenCalledWith('Updating page 1')
    expect(gainLossUtil.getGainLoss).toHaveBeenCalledTimes(1)
    expect(gainLossUtil.getGainLoss).toHaveBeenCalledWith(1)
    expect(gainLossSchema).not.toHaveBeenCalled()
    expect(saveFunc).not.toHaveBeenCalled()
    expect(logUtil.log).toHaveBeenCalledWith('Done')
  })

  it('Calls first page. Does not call another page if all records already exist', async () => {
    gainLossUtil.getGainLoss.mockReturnValue([
      { some: 'record' },
      { some: 'otherrecord' },
    ])
    gainLossSchema.findOne.mockReturnValue('notnullvalue')
    await updateGainLossCollection()
    expect(logUtil.log).toHaveBeenCalledWith('Updating page 1')
    expect(gainLossUtil.getGainLoss).toHaveBeenCalledTimes(1)
    expect(gainLossUtil.getGainLoss).toHaveBeenCalledWith(1)
    expect(gainLossSchema.findOne).toHaveBeenCalledTimes(2)
    expect(gainLossSchema.findOne).toHaveBeenCalledWith({ hashId: '37455f1a855e21986679cda5b72c4e19c632cb93eb444f6c52c5fe005b291244' })
    expect(gainLossSchema.findOne).toHaveBeenCalledWith({ hashId: '2d193b4a7e52d701ba7b6331ec59ff5dd477fe732237a98faa17f1d85ced21c4' })
    expect(gainLossSchema).not.toHaveBeenCalled()
    expect(saveFunc).not.toHaveBeenCalled()
    expect(logUtil.log).toHaveBeenCalledWith('Done')
  })

  it('Calls pages until a page has all records found', async () => {
    gainLossUtil.getGainLoss.mockReturnValue([
      { some: 'record' },
      { some: 'otherrecord' },
    ])

    // First page
    gainLossSchema.findOne.mockReturnValueOnce(null)
    gainLossSchema.findOne.mockReturnValueOnce(null)

    // Second page
    gainLossSchema.findOne.mockReturnValueOnce(null)
    gainLossSchema.findOne.mockReturnValueOnce('notnullvalue')

    // Third page
    gainLossSchema.findOne.mockReturnValueOnce('notnullvalue')
    gainLossSchema.findOne.mockReturnValueOnce('notnullvalue')

    await updateGainLossCollection()
    expect(logUtil.log).toHaveBeenCalledTimes(4)
    expect(logUtil.log).toHaveBeenCalledWith('Updating page 1')
    expect(logUtil.log).toHaveBeenCalledWith('Updating page 2')
    expect(logUtil.log).toHaveBeenCalledWith('Updating page 3')

    expect(gainLossUtil.getGainLoss).toHaveBeenCalledTimes(3)
    expect(gainLossUtil.getGainLoss).toHaveBeenCalledWith(1)
    expect(gainLossUtil.getGainLoss).toHaveBeenCalledWith(2)
    expect(gainLossUtil.getGainLoss).toHaveBeenCalledWith(3)

    expect(gainLossSchema.findOne).toHaveBeenCalledTimes(6)
    // There are only 2 unique records here so only need to test for these two hashes
    expect(gainLossSchema.findOne).toHaveBeenCalledWith({ hashId: '37455f1a855e21986679cda5b72c4e19c632cb93eb444f6c52c5fe005b291244' })
    expect(gainLossSchema.findOne).toHaveBeenCalledWith({ hashId: '2d193b4a7e52d701ba7b6331ec59ff5dd477fe732237a98faa17f1d85ced21c4' })

    expect(gainLossSchema).toHaveBeenCalledTimes(3) // One for each null value
    expect(gainLossSchema).toHaveBeenCalledWith({ hashId: '37455f1a855e21986679cda5b72c4e19c632cb93eb444f6c52c5fe005b291244', some: 'record' })
    expect(gainLossSchema).toHaveBeenCalledWith({ hashId: '2d193b4a7e52d701ba7b6331ec59ff5dd477fe732237a98faa17f1d85ced21c4', some: 'otherrecord' })

    expect(saveFunc).toHaveBeenCalledTimes(3) // One for each null value

    expect(logUtil.log).toHaveBeenCalledWith('Done')
  })
})