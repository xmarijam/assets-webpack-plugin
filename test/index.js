import test from 'ava'
import path from 'path'
import fs from 'fs'
import {dirSync as tmpDir} from 'tmp'
import webpack from 'webpack'
import ExtractTextPlugin from 'extract-text-webpack-plugin'
import mkdirp from 'mkdirp'
import AssetsWebpackPlugin from '..'

test('generates a default file for a single entry point', (t) => {
  const outputDir = tmpDir().name
  const buildWebpack = createBuildWebpack(outputDir, t)

  const webpackConfig = {
    entry: path.join(__dirname, 'fixtures', 'one.js'),
    output: {
      path: outputDir,
      filename: 'index-bundle.js'
    },
    plugins: [new AssetsWebpackPlugin({path: outputDir})]
  }

  return buildWebpack(webpackConfig)
    .then((content) => {
      t.deepEqual(JSON.parse(content), {
        entries: {
          main: {
            js: 'index-bundle.js'
          }
        },
        assets: []
      })
    })
})

test('generates a default file with multiple entry points', (t) => {
  const outputDir = tmpDir().name
  const buildWebpack = createBuildWebpack(outputDir, t)

  const webpackConfig = {
    entry: {
      one: path.join(__dirname, 'fixtures', 'one.js'),
      two: path.join(__dirname, 'fixtures', 'two.js')
    },
    output: {
      path: outputDir,
      filename: '[name]-bundle.js'
    },
    plugins: [new AssetsWebpackPlugin({path: outputDir})]
  }

  return buildWebpack(webpackConfig)
    .then((content) => {
      t.deepEqual(JSON.parse(content), {
        entries: {
          one: {
            js: 'one-bundle.js'
          },
          two: {
            js: 'two-bundle.js'
          }
        },
        assets: []
      })
    })
})

test('allows you to specify your own filename', (t) => {
  const outputDir = tmpDir().name
  const buildWebpack = createBuildWebpack(outputDir, t)

  const webpackConfig = {
    entry: path.join(__dirname, 'fixtures', 'one.js'),
    output: {
      path: outputDir,
      filename: 'index-bundle.js'
    },
    plugins: [new AssetsWebpackPlugin({
      filename: 'foo.json',
      path: outputDir
    })]
  }

  return buildWebpack(webpackConfig, 'foo.json')
    .then((content) => {
      t.deepEqual(JSON.parse(content), {
        entries: {
          main: {
            js: 'index-bundle.js'
          }
        },
        assets: []
      })
    })
})

test('skips source maps', (t) => {
  const outputDir = tmpDir().name
  const buildWebpack = createBuildWebpack(outputDir, t)

  const webpackConfig = {
    devtool: 'sourcemap',
    entry: path.join(__dirname, 'fixtures', 'one.js'),
    output: {
      path: outputDir,
      filename: 'index-bundle.js'
    },
    plugins: [new AssetsWebpackPlugin({path: outputDir})]
  }

  return buildWebpack(webpackConfig)
    .then((content) => {
      t.deepEqual(JSON.parse(content), {
        entries: {
          main: {
            js: 'index-bundle.js'
          }
        },
        assets: []
      })
    })
})

test('handles hashes in bundle filenames', (t) => {
  const outputDir = tmpDir().name
  const buildWebpack = createBuildWebpack(outputDir, t)

  const webpackConfig = {
    entry: path.join(__dirname, 'fixtures', 'one.js'),
    output: {
      path: outputDir,
      filename: 'index-bundle-[hash].js'
    },
    plugins: [new AssetsWebpackPlugin({path: outputDir})]
  }

  return buildWebpack(webpackConfig)
    .then((content) => {
      const jsFileName = JSON.parse(content).entries.main.js
      t.true(/index-bundle-[0-9a-f]+\.js/.test(jsFileName))
    })
})

test('handles hashes in a different position', (t) => {
  const outputDir = tmpDir().name
  const buildWebpack = createBuildWebpack(outputDir, t)

  const webpackConfig = {
    entry: path.join(__dirname, 'fixtures', 'one.js'),
    output: {
      path: outputDir,
      filename: '[name].js?[hash]'
    },
    plugins: [new AssetsWebpackPlugin({path: outputDir})]
  }

  return buildWebpack(webpackConfig)
    .then((content) => {
      const jsFileName = JSON.parse(content).entries.main.js
      t.true(/main\.js\?[0-9a-f]+/.test(jsFileName))
    })
})

test('works with ExtractTextPlugin for stylesheets', (t) => {
  const outputDir = tmpDir().name
  const buildWebpack = createBuildWebpack(outputDir, t)

  const webpackConfig = {
    entry: {
      one: path.join(__dirname, 'fixtures', 'one.js'),
      two: path.join(__dirname, 'fixtures', 'two.js'),
      styles: path.join(__dirname, 'fixtures', 'styles.js')
    },
    output: {
      path: outputDir,
      filename: '[name]-bundle.js'
    },
    module: {
      loaders: [
        {test: /\.css$/, loader: ExtractTextPlugin.extract('style-loader', 'css-loader')}
      ]
    },
    plugins: [
      new ExtractTextPlugin('[name]-bundle.css', {allChunks: true}),
      new AssetsWebpackPlugin({
        path: outputDir
      })
    ]
  }

  return buildWebpack(webpackConfig)
    .then((content) => {
      t.deepEqual(JSON.parse(content), {
        entries: {
          one: {
            js: 'one-bundle.js'
          },
          two: {
            js: 'two-bundle.js'
          },
          styles: {
            js: 'styles-bundle.js',
            css: 'styles-bundle.css'
          }
        },
        assets: []
      })
    })
})

test('includes full publicPath', (t) => {
  const outputDir = tmpDir().name
  const buildWebpack = createBuildWebpack(outputDir, t)

  const webpackConfig = {
    entry: path.join(__dirname, 'fixtures', 'one.js'),
    output: {
      path: outputDir,
      publicPath: '/public/path/[hash]/',
      filename: 'index-bundle.js'
    },
    plugins: [new AssetsWebpackPlugin({path: outputDir})]
  }

  return buildWebpack(webpackConfig)
    .then((content) => {
      const jsFileName = JSON.parse(content).entries.main.js
      t.true(/\/public\/path\/[0-9a-f]+\/index-bundle.js/.test(jsFileName))
    })
})

test('does not include full publicPath', (t) => {
  const outputDir = tmpDir().name
  const buildWebpack = createBuildWebpack(outputDir, t)

  const webpackConfig = {
    entry: path.join(__dirname, 'fixtures', 'one.js'),
    output: {
      path: outputDir,
      publicPath: '/public/path/[hash]/',
      filename: 'index-bundle.js'
    },
    plugins: [new AssetsWebpackPlugin({
      path: outputDir,
      fullPath: false
    })]
  }

  return buildWebpack(webpackConfig)
    .then((content) => {
      t.deepEqual(JSON.parse(content), {
        entries: {
          main: {
            js: 'index-bundle.js'
          }
        },
        assets: []
      })
    })
})

test('works with CommonChunksPlugin', (t) => {
  const outputDir = tmpDir().name
  const buildWebpack = createBuildWebpack(outputDir, t)

  const webpackConfig = {
    entry: {
      one: path.join(__dirname, 'fixtures', 'common-chunks', 'one.js'),
      two: path.join(__dirname, 'fixtures', 'common-chunks', 'two.js')
    },
    output: {
      path: outputDir,
      filename: '[name].js'
    },
    plugins: [
      new webpack.optimize.CommonsChunkPlugin({name: 'common'}),
      new AssetsWebpackPlugin({path: outputDir})
    ]
  }

  return buildWebpack(webpackConfig)
    .then((content) => {
      t.deepEqual(JSON.parse(content), {
        entries: {
          one: {js: 'one.js'},
          two: {js: 'two.js'},
          common: {js: 'common.js'}
        },
        assets: []
      })
    })
})

test('allows injection of metadata', (t) => {
  const outputDir = tmpDir().name
  const buildWebpack = createBuildWebpack(outputDir, t)

  const webpackConfig = {
    entry: path.join(__dirname, 'fixtures', 'one.js'),
    output: {
      path: outputDir,
      filename: 'index-bundle.js'
    },
    plugins: [new AssetsWebpackPlugin({
      path: outputDir,
      metadata: {
        foo: 'bar',
        baz: 'buz'
      }
    })]
  }

  return buildWebpack(webpackConfig)
    .then((content) => {
      t.deepEqual(JSON.parse(content), {
        entries: {
          main: {
            js: 'index-bundle.js'
          }
        },
        assets: [],
        metadata: {
          foo: 'bar',
          baz: 'buz'
        }
      })
    })
})

test('generates a default file with assets', (t) => {
  const outputDir = tmpDir().name
  const buildWebpack = createBuildWebpack(outputDir, t)

  const webpackConfig = {
    entry: path.join(__dirname, 'fixtures', 'images.js'),
    output: {
      path: outputDir,
      filename: 'index-bundle.js'
    },
    module: {
      loaders: [
        {test: /\.svg$/, loader: 'file?name=[path][name].[ext]'}
      ]
    },
    plugins: [new AssetsWebpackPlugin({
      path: outputDir
    })]
  }

  return buildWebpack(webpackConfig)
    .then((content) => {
      t.deepEqual(JSON.parse(content), {
        entries: {
          main: {
            js: 'index-bundle.js'
          }
        },
        assets: [{
          name: 'fixtures/home.svg',
          path: 'fixtures/home.svg'
        }]
      })
    })
})

test('allows overriding of assetsRegex', (t) => {
  const outputDir = tmpDir().name
  const buildWebpack = createBuildWebpack(outputDir, t)

  const webpackConfig = {
    entry: path.join(__dirname, 'fixtures', 'multiple-images.js'),
    output: {
      path: outputDir,
      filename: 'index-bundle.js'
    },
    module: {
      loaders: [
        {test: /\.svg|png$/, loader: 'file?name=[path][name].[ext]'}
      ]
    },
    plugins: [new AssetsWebpackPlugin({
      path: outputDir,
      assetsRegex: /\.(png)$/
    })]
  }

  return buildWebpack(webpackConfig)
    .then((content) => {
      t.deepEqual(JSON.parse(content), {
        entries: {
          main: {
            js: 'index-bundle.js'
          }
        },
        assets: [{
          name: 'fixtures/home.png',
          path: 'fixtures/home.png'
        }]
      })
    })
})

test('works in multi-compiler mode', (t) => {
  const outputDir = tmpDir().name
  const buildWebpack = createBuildWebpack(outputDir, t)

  const plugin = new AssetsWebpackPlugin({path: outputDir})
  const webpackConfig = [
    {
      entry: {
        one: path.join(__dirname, 'fixtures', 'one.js')
      },
      output: {
        path: outputDir,
        filename: 'one-bundle.js'
      },
      plugins: [plugin]
    },
    {
      entry: {
        two: path.join(__dirname, 'fixtures', 'two.js')
      },
      output: {
        path: outputDir,
        filename: 'two-bundle.js'
      },
      plugins: [plugin]
    }
  ]

  return buildWebpack(webpackConfig)
    .then((content) => {
      t.deepEqual(JSON.parse(content), {
        entries: {
          one: {
            js: 'one-bundle.js'
          },
          two: {
            js: 'two-bundle.js'
          }
        },
        assets: []
      })
    })
})

test('updates output between compiler calls when options.update is true', (t) => {
  const outputDir = tmpDir().name
  const buildWebpack = createBuildWebpack(outputDir, t)

  const webpackConfig1 = {
    entry: {
      one: path.join(__dirname, 'fixtures', 'one.js')
    },
    output: {
      path: outputDir,
      filename: 'one-bundle.js'
    },
    plugins: [new AssetsWebpackPlugin({path: outputDir, update: true})]
  }
  const webpackConfig2 = {
    entry: {
      two: path.join(__dirname, 'fixtures', 'two.js')
    },
    output: {
      path: outputDir,
      filename: 'two-bundle.js'
    },
    plugins: [new AssetsWebpackPlugin({path: outputDir, update: true})]
  }

  return buildWebpack(webpackConfig1)
    .then(() => buildWebpack(webpackConfig2))
    .then((content) => {
      t.deepEqual(JSON.parse(content), {
        entries: {
          one: {js: 'one-bundle.js'},
          two: {js: 'two-bundle.js'}
        }, assets: []
      })
    })
})

test('updates output between compiler calls when options.update is true', (t) => {
  const outputDir = tmpDir().name
  const buildWebpack = createBuildWebpack(outputDir, t)

  const webpackConfig1 = {
    entry: {
      one: path.join(__dirname, 'fixtures', 'one.js')
    },
    output: {
      path: outputDir,
      filename: 'one-bundle.js'
    },
    plugins: [new AssetsWebpackPlugin({path: outputDir, update: false})]
  }
  const webpackConfig2 = {
    entry: {
      two: path.join(__dirname, 'fixtures', 'two.js')
    },
    output: {
      path: outputDir,
      filename: 'two-bundle.js'
    },
    plugins: [new AssetsWebpackPlugin({path: outputDir, update: false})]
  }

  return buildWebpack(webpackConfig1)
    .then(() => buildWebpack(webpackConfig2))
    .then((content) => {
      t.deepEqual(JSON.parse(content), {
        entries: {
          two: {js: 'two-bundle.js'}
        }, assets: []
      })
    })
})

function createBuildWebpack (outputDir, t) {
  return function buildWebpack (webpackConfig, outputFile = 'webpack-assets.json') {
    return new Promise((resolve, reject) => {
      // Create output folder
      mkdirp(outputDir, function (err) {
        t.is(err, null)

        webpack(webpackConfig, function (err, stats) {
          t.is(err, null)
          t.false(stats.hasErrors())

          const content = fs.readFileSync(path.join(outputDir, outputFile)).toString()
          resolve(content)
        })
      })
    })
  }
}
