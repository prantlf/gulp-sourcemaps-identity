const { ensureMappings } = require('gulp-sourcemaps-identity')
const { strictEqual } = require('assert')
const test = require('tehanu')(__filename)

test('exports all methods', () => {
  strictEqual(typeof ensureMappings, 'function')
})
