import test from 'ava'
import {getAssetKind, getFileExtension, pluginError} from '.'

test('getAssetKind', (t) => {
  t.is(getAssetKind('desktop.js'), 'js')
  t.is(getAssetKind('desktop.js?9b913c8594ce98e06b21'), 'js')
})

test('getFileExtension', (t) => {
  t.is(getFileExtension('main.js'), 'js')
  t.is(getFileExtension('main.js?9b913c8594ce98e06b21'), 'js')
})

test('pluginError', (t) => {
  const prevErr = new Error('Test error')
  prevErr.stack = 'Test stack'
  prevErr.lol = 'Test stack'
  const err = pluginError('New test error', prevErr)
  t.is(err.message, '[AssetsWebpackPlugin] New test error')
  t.regex(err.stack, /Error: \[AssetsWebpackPlugin\] New test error/)
  t.is(err.lol, 'Test stack')
})
