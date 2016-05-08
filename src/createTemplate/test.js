import test from 'ava'
import parseTemplate from '.'

test('parseTemplate parses an empty string', (t) => {
  t.deepEqual(parseTemplate('').fields, [
    {prefix: '', placeholder: null}
  ])
})

test('parseTemplate parses consecutive placeholders', (t) => {
  t.deepEqual(parseTemplate('[id][name][query]').fields, [
    {prefix: '', placeholder: 'id'},
    {prefix: '', placeholder: 'name'},
    {prefix: '', placeholder: 'query'},
    {prefix: '', placeholder: null}
  ])
})

test('parseTemplate parses placeholders and prefixes', (t) => {
  t.deepEqual(parseTemplate('some[id]and[name]then[query]').fields, [
    {prefix: 'some', placeholder: 'id'},
    {prefix: 'and', placeholder: 'name'},
    {prefix: 'then', placeholder: 'query'},
    {prefix: '', placeholder: null}
  ])
})

test('parseTemplate handles unknown placeholders', (t) => {
  t.deepEqual(parseTemplate('some[unknown][id]then[hash:pwnd][query]').fields, [
    {prefix: 'some[unknown]', placeholder: 'id'},
    {prefix: 'then[hash:pwnd]', placeholder: 'query'},
    {prefix: '', placeholder: null}
  ])
})

test('parseTemplate handles wierdly formatted placeholders', (t) => {
  t.deepEqual(parseTemplate('some[chunk[id]then[whoops[query]]').fields, [
    {prefix: 'some[chunk', placeholder: 'id'},
    {prefix: 'then[whoops', placeholder: 'query'},
    {prefix: ']', placeholder: null}
  ])
})

test('parseTemplate parses hash width syntax', (t) => {
  t.deepEqual(parseTemplate('[hash:10]and[chunkhash:42]').fields, [
    {prefix: '', placeholder: 'hash', width: 10},
    {prefix: 'and', placeholder: 'chunkhash', width: 42},
    {prefix: '', placeholder: null}
  ])
})

test('parseTemplate matches strings without placeholders', (t) => {
  const tpl = parseTemplate('foo-bar.jsx')
  t.true(tpl.matches('foo-bar.jsx'))
  t.false(tpl.matches('foo-bar.css'))
})

test('parseTemplate matches strings with [id] placeholder', (t) => {
  const tpl = parseTemplate('foo-bar.[id].js')
  t.true(tpl.matches('foo-bar.666.js'))
  t.false(tpl.matches('foo-bar.nope.js'))
})

test('parseTemplate matches strings with [name] placeholder', (t) => {
  const tpl = parseTemplate('[name].js')
  t.true(tpl.matches('foo-bar.chunk.js'))
  t.false(tpl.matches('foo-bar.chunk.css'))
})

test('parseTemplate matches strings with [query] placeholder', (t) => {
  const tpl = parseTemplate('[name].js[query]')
  t.true(tpl.matches('foo-bar.js?anything'))
  // query parameter is optional, so this should match too
  t.true(tpl.matches('foo-bar.js'))
})

test('parseTemplate matches strings with [hash] placeholder', (t) => {
  const tpl = parseTemplate('[name]_[hash].js')
  t.true(tpl.matches('foo-bar_f00b43.js'))
  t.false(tpl.matches('foo-bar_w00t.js'))
})

test('parseTemplate matches strings with constrained-width [hash] placeholder', (t) => {
  const tpl = parseTemplate('[name]_[hash:6].js')
  t.true(tpl.matches('foo-bar_f00.js'))
  t.true(tpl.matches('foo-bar_b4d455.js'))
  t.false(tpl.matches('foo-bar_f00b43b47.js'))
})
