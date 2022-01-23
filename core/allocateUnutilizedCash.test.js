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

  })

  it('Does nothing if allocateUnutilizedCash is false', async () => {

  })

  it('Does nothing if position goals is empty', async () => {

  })

  it('Does nothing if position goals have all been fulfilled', async () => {
        
  })


})