const path = require('path')
const URL = require('url')
const camelcase = require('camelcase')
const assign = require('lodash.assign')

module.exports = {
  getFileExtension,
  getAssetKind,
  pluginError
}

function getFileExtension (asset) {
  const url = URL.parse(asset)
  const ext = path.extname(url.pathname)
  return ext ? ext.slice(1) : ''
}

function getAssetKind (asset) {
  const ext = getFileExtension(asset)
  return camelcase(ext)
}

function pluginError (message, prevError) {
  const err = new Error('[AssetsWebpackPlugin] ' + message)
  // TODO: Figure out why assign but not assignIn which assigns
  //       inherited properties. See "err.stack" in the test.
  return prevError ? assign(err, prevError) : err
}
