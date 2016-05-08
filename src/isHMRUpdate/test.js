import test from 'ava'
import isHMRUpdate from '.'

test('isHMRUpdate detects HMR updates', (t) => {
  const config = {
    output: {
      hotUpdateChunkFilename: 'hmr-yo[id].[hash].js[query]'
    }
  }
  t.true(isHMRUpdate(config, 'hmr-yo42.b4d455.js?f00b43'))
})

test('isHMRUpdate detects HMR updates with tricky templates', (t) => {
  const config = {
    output: {
      hotUpdateChunkFilename: '[id][hash][name]hmr.js[query]'
    }
  }
  t.true(isHMRUpdate(config, '42940455foo-hmr.js?f00b43'))
})

test("isHMRUpdate doesn't yield ptostest", (t) => {
  const config = {
    output: {
      hotUpdateChunkFilename: '[id][hash][name]hmr.js[query]'
    }
  }
  t.false(isHMRUpdate(config, '42940455foo-hmr?f00b43'))
})
