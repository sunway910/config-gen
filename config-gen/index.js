/**
 * config generators
 */
const path = require("path");
const { writeConfig } = require("../utils");
const { genChainConfig, genChainComposeConfig } = require("./chain-config.gen");
const {
  genBucketConfig,
  genBucketComposeConfig,
} = require("./bucket-config.gen");
const { genKaleidoComposeConfigs } = require("./kaleido-config.gen");
const { genWatchtowerComposeConfig } = require("./watchtower-config.gen");
const { logger } = require("../logger");

/**
 * configuration of generators to use
 * name: the generator name
 *
 * async configFun(config, outputOptions) => {file, paths}
 * file: the result filename
 * paths: an array of files/directories should be verified later
 *    required: boolean whether this file is a mandontary requirement
 *    path: the file path
 *
 * async composeFunc(config) => composeConfig
 * return the service definition for this generator
 */
const configGenerators = [
  {
    name: "chain",
    configFunc: genChainConfig,
    to: path.join("chain", "config.json"),
    composeFunc: genChainComposeConfig,
  },
  {
    name: "bucket",
    configFunc: genBucketConfig,
    to: path.join("bucket", "config.yaml"),
    composeFunc: genBucketComposeConfig,
  },
  {
    name: "kaleido",
    composeFunc: genKaleidoComposeConfigs,
  },
  {
    name: "watchtower",
    composeFunc: genWatchtowerComposeConfig,
  },
];

async function genConfig(config, outputOpts) {
  // application config generation
  let outputs = [];
  const { baseDir } = outputOpts;
  for (const cg of configGenerators) {
    if (!config[cg.name] || !cg.configFunc) {
      continue;
    }
    const ret = await cg.configFunc(config, outputOpts);
    await writeConfig(path.join(baseDir, cg.to), ret.config);
    outputs.push({
      generator: cg.name,
      ...ret,
    });
  }

  logger.info("Generating configurations done");
  return outputs;
}

async function genComposeConfig(config) {
  // docker compose config generation
  let output = {
    version: "3.0",
    services: {},
  };

  var hasKaleidoNetwork = false;
  let buildComposeService = function (serviceCfg, name, struct) {
    if (!serviceCfg["container_name"]) {
      serviceCfg["container_name"] = name;
    }
    if (serviceCfg.networks && serviceCfg.networks["kaleido"]) {
      hasKaleidoNetwork = true;
    }
    return {
      ...struct,
      services: {
        ...struct.services,
        [serviceCfg.container_name]: serviceCfg,
      },
    };
  };

  for (const cg of configGenerators) {
    if (!(config[cg.name] || cg.name === "watchtower")) {
      continue;
    }
    const serviceCfg = await cg.composeFunc(config);
    if (Array.isArray(serviceCfg)) {
      serviceCfg.forEach(
        (e) => (output = buildComposeService(e, cg.name, output))
      );
    } else {
      output = buildComposeService(serviceCfg, cg.name, output);
    }
  }
  if (hasKaleidoNetwork) {
    output["networks"] = {
      kaleido: {
        name: "kaleido",
        driver: "bridge",
        ipam: {
          config: [
            {
              subnet: "172.18.0.0/16",
            },
          ],
        },
      },
    };
  }

  logger.info("Generating docker compose file done");

  return output;
}

module.exports = {
  genConfig,
  genComposeConfig,
};
