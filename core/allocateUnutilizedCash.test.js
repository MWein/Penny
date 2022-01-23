const cashSecuredPutUtil = require('./cashSecuredPut')
const settingsUtil = require('../utils/settings')
const logUtil = require('../utils/log')
const positionUtil = require('../tradier/getPositions')
const orderUtil = require('../tradier/getOrders')


const {
  allocateUnutilizedCash
} = require('./allocateUnutilizedCash')


describe('allocateUnutilizedCash', () => {
  beforeEach(() => {
    cashSecuredPutUtil.getPositionsToSell = jest.fn()
    settingsUtil.getSettings = jest.fn()
    logUtil.log = jest.fn()
    positionUtil.getPositions = jest.fn()
    orderUtil.getOrders = jest.fn()
  })

  it('On exception, logs error', async () => {
    settingsUtil.getSettings.mockImplementation(() => {
      throw new Error('OH NOOOOOO')
    })
    await allocateUnutilizedCash()
    expect(logUtil.log).toHaveBeenCalledWith({
      type: 'error',
      message: 'Error: OH NOOOOOO',
    })
  })

  it('Does nothing if allocateUnutilizedCash is false', async () => {
    settingsUtil.getSettings.mockReturnValue({
      allocateUnutilizedCash: false,
    })
    await allocateUnutilizedCash()
    expect(logUtil.log).toHaveBeenCalledWith('Allocate Unutilized Funds Disabled')
    expect(positionUtil.getPositions).not.toHaveBeenCalled()
    expect(orderUtil.getOrders).not.toHaveBeenCalled()
  })

  it('Does nothing if position goals is empty', async () => {

  })

  it('Does nothing if position goals have all been fulfilled', async () => {
        
  })


})