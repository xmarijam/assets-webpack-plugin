const createTemplate = require('../createTemplate')

module.exports = function isSourceMap (options, asset) {
  if (options && options.output && options.output.sourceMapFilename) {
    const sourceMapFilename = options.output.sourceMapFilename
    const sourcemapTemplate = createTemplate(sourceMapFilename)
    return sourcemapTemplate.matches(asset)
  }
}
