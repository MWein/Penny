const gainLossUtil = require('../tradier/getGainLoss')
const logUtil = require('./log')
const gainLossSchema = require('../db_models/gainLossSchema')
const crypto = require('crypto')

// Returns true if a new record was created
// False if it already exists
const _findOrInsertRecord = async record => {
  try {
    const hashId = crypto.createHash('sha256').update(JSON.stringify(record)).digest('hex')
    const oldRecord = await gainLossSchema.findOne({ hashId })
    if (!oldRecord) {
      const newRecord = new gainLossSchema({
        hashId,
        ...record,
      })
      await newRecord.save()
      return true
    }
    return false
  } catch (e) {
    return false
  }
}


const updateGainLossCollection = async () => {
  let moreOnNextPage = true
  let page = 1

  while (moreOnNextPage) {
    logUtil.log(`Updating page ${page}`)

    const gainLoss = await gainLossUtil.getGainLoss(page)

    const updateRecordsResults = await Promise.all(gainLoss.map(async gl => {
      const result = await _findOrInsertRecord(gl)
      return result
    }))

    moreOnNextPage = updateRecordsResults.some(result => result)
    page++
  }

  logUtil.log('Done')
}


module.exports = {
  _findOrInsertRecord,
  updateGainLossCollection,
}