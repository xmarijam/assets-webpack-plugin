const merge = require('lodash.merge')
const {getAssetKind} = require('./src/utils')
const isHMRUpdate = require('./src/isHMRUpdate')
const isSourceMap = require('./src/isSourceMap')
const createQueuedWriter = require('./src/createQueuedWriter')
const createOutputWriter = require('./src/createOutputWriter')

/**
 * @class
 *
 * @summary The plugin class
 *
 * @description
 * Creates an instance of a webpack plugin. Accepts
 * an optional options object.
 *
 * The plugin adds 'after-emit' hook to webpack and reads
 * build stats. It writes JSON file with paths to entry points
 * according to * webpack setup ([output option] in webpack config).
 *
 *   {
 *     "landing": {
 *       "js": "/assets/js/landing-561a78bc2881c321f384.js",
 *       "css": "/assets/css/landing-j7f3odbc2f81c3f4ad00.css"
 *     },
 *     "app": {
 *       "js": "/assets/js/app-i4937c9f746590dj473g.js",
 *     }
 *   }
 *
 * [output option]: https://webpack.js.org/configuration/output/
 *
 * @param {Object} [options] - the object with options
 * @param {string} [options.filename='webpack-assets.json']
 *   - name for the created JSON file
 * @param {boolean} [options.fullPath=true]
 *   - if false the output will not include the full path
 *   of the generated file, just bare file names
 * @param {boolean} [options.includeManifest=false]
 *   - allows to include CommonsChunkPlugin's run time code
 *   as a text, so that it can be inlined into the template
 *   []: https://webpack.js.org/guides/code-splitting-libraries/#manifest-file
 * @param {string} [options.path=process.cwd()]
 *   - path where to save the created JSON file.
 * @param {boolean} [options.prettyPrint=false]
 *   - whether to format the JSON output for readability.
 * @param {Function} [options.processOutput=JSON.stringify]
 *   - post-processor function that accepts assets paths as an object
 *   and produces a content for the JSON file.
 * @param {boolean} [options.update=false]
 *   - if true JSON file will be updated instead of overwritten
 * @param {metadata} [options.metadata]
 *   - inject metadata into the output file.
 *   All values will be injected into the key "metadata".
 */
function AssetsWebpackPlugin (options) {
  this.options = merge({}, {
    path: '.',
    filename: 'webpack-assets.json',
    prettyPrint: false,
    update: false,
    fullPath: true,
    assetsRegex: /\.(jpe?g|png|gif|svg)$/
  }, options)
  this.writer = createQueuedWriter(createOutputWriter(this.options))
}

AssetsWebpackPlugin.prototype = {

  constructor: AssetsWebpackPlugin,

  apply: function (compiler) {
    var self = this

    compiler.plugin('after-emit', function (compilation, callback) {
      var output = {}
      var options = compiler.options
      var stats = compilation.getStats().toJson({
        hash: true,
        publicPath: true,
        assets: true,
        chunks: false,
        modules: false,
        source: false,
        errorDetails: false,
        timings: false
      })
            // publicPath with resolved [hash] placeholder

      var assetPath = (stats.publicPath && self.options.fullPath) ? stats.publicPath : ''
            // assetsByChunkName contains a hash with the bundle names and the produced files
            // e.g. { one: 'one-bundle.js', two: 'two-bundle.js' }
            // in some cases (when using a plugin or source maps) it might contain an array of produced files
            // e.g. {
            // main:
            //   [ 'index-bundle-42b6e1ec4fa8c5f0303e.js',
            //     'index-bundle-42b6e1ec4fa8c5f0303e.js.map' ]
            // }
      var assetsByChunkName = stats.assetsByChunkName

      output.entries = Object.keys(assetsByChunkName).reduce(function (chunkMap, chunkName) {
        var assets = assetsByChunkName[chunkName]
        if (!Array.isArray(assets)) {
          assets = [assets]
        }
        chunkMap[chunkName] = assets.reduce(function (typeMap, asset) {
          if (isHMRUpdate(options, asset) || isSourceMap(options, asset)) {
            return typeMap
          }

          var typeName = getAssetKind(asset)
          typeMap[typeName] = assetPath + asset

          return typeMap
        }, {})

        return chunkMap
      }, {})

      output.assets = stats.assets.filter(function (asset) {
        return self.options.assetsRegex.test(asset.name)
      }).map(function (asset) {
        return { name: asset.name, path: assetPath + asset.name }
      })

      if (self.options.metadata) {
        output.metadata = self.options.metadata
      }

      self.writer(output, function (err) {
        if (err) {
          compilation.errors.push(err)
        }
        callback()
      })
    })
  }
}

module.exports = AssetsWebpackPlugin
