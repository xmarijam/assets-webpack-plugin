const createTemplate = require('../createTemplate')

module.exports = function isHMRUpdate (options, asset) {
  const hotUpdateChunkFilename = options.output.hotUpdateChunkFilename
  const hotUpdateTemplate = createTemplate(hotUpdateChunkFilename)
  return hotUpdateTemplate.matches(asset)
}
