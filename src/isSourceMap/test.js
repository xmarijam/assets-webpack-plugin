import test from 'ava'
import isSourceMap from '.'

test('detects sourcemaps', (t) => {
  const config = {
    output: {
      sourceMapFilename: 'sourcemap-yo[id].[hash].js[query]'
    }
  }
  t.true(isSourceMap(config, 'sourcemap-yo42.b4d455.js?f00b43'))
})

test('detects sourcemaps with tricky templates', (t) => {
  const config = {
    output: {
      sourceMapFilename: '[id][hash][name]_map.js[query]'
    }
  }
  t.true(isSourceMap(config, '42940455foo_map.js?f00b43'))
})

test("doesn't fail when the passed asset doesn't match source map pattern", (t) => {
  const config = {
    output: {
      sourceMapFilename: '[id][hash][name]_map.js[query]'
    }
  }
  t.false(isSourceMap(config, '42940455foo.js?f00b43'))
})

test("doesn't fail when the config is dummy", () => {
  isSourceMap({}, '42940455foo.js?f00b43')
})
