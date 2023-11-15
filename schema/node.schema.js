const Joi = require('joi')

const nodeSchema = Joi.object({
  mode: Joi.string().valid('authority', 'storage', 'watcher').required(),
  chainWsUrl: Joi.string().required(),
  backupChainWsUrls: Joi.array().optional(),
  region: Joi.string().default("en"),
  profile: Joi.string().valid('devnet', 'testnet', 'mainnet').default("testnet"),
  noWatchContainers: Joi.array().optional(),
})

module.exports = {
  nodeSchema,
}