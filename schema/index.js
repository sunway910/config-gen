
const Joi = require('joi')
const { nodeSchema } = require('./node.schema')
const { chainSchema } = require('./chain.schema')
const { bucketSchema } = require('./bucket.schema')
const { cesealSchema } = require('./ceseal.schema')
const { nginxSchema } = require('./nginx.schema')

function getConfigSchema(config) {
  let sMap = {
    node: nodeSchema.required(),
  }

  if (config.node.mode == "authority") {
    sMap["chain"] = chainSchema.optional()
    sMap["ceseal"] = cesealSchema.required()
    sMap["nginx"] = nginxSchema.optional()
  }
  else if (config.node.mode == "storage") {
    sMap["chain"] = chainSchema.optional();
    sMap["bucket"] = bucketSchema.required()
  }
  else if (config.node.mode == "watcher") {
    sMap["chain"] = chainSchema.required()
  }
  else {
    throw Error("invalid config.node.mode:" + toString(config.node.type))
  }

  return Joi.object(sMap)
}

module.exports = {
  getConfigSchema,
}
