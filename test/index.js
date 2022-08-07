import { ok, strictEqual } from 'assert'
import tehanu from 'tehanu'
import gulp from 'gulp'
import sourcemaps from 'gulp-sourcemaps'
import eventStream from 'event-stream'
import { ensureMappings } from 'gulp-sourcemaps-identity'

const test = tehanu(import.meta.url)
const { through } = eventStream

test('with invalid file object', () => new Promise((resolve, reject) => {
  gulp
    .src('test/samples/valid.js')
    .pipe(sourcemaps.init())
    .pipe(through(function () {
      this.queue({
        relative: 'no-buffer',
        isBuffer() { return false }
      })
    }))
    .pipe(ensureMappings())
    .on('error', message => {
      if (message === 'reading no-buffer failed') resolve()
      else reject(new Error(message))
    })
    .on('end', () => reject(new Error('invalid file passed')))
  }))

test('with malformed file content', () => new Promise((resolve, reject) => {
  let mappings
  gulp
    .src('test/samples/invalid.txt')
    .pipe(sourcemaps.init())
    .pipe(through(function (file) {
      mappings = file.sourceMap.mappings
      this.queue(file)
    }))
    .pipe(ensureMappings())
    .pipe(sourcemaps.write('../out-malformed', {
      includeContent: false,
      sourceRoot: '../test/samples'
    }))
    // .pipe(gulp.dest('out-malformed'))
    .pipe(through(function ({ sourceMap }) {
      strictEqual(sourceMap.mappings, mappings, 'original mappings')
    }))
    .on('error', message => reject(new Error(message)))
    .on('end', () => resolve())
  }))

test('with no source map', () => new Promise((resolve, reject) => {
  gulp
    .src('test/samples/valid.js')
    .pipe(ensureMappings({ verbose: true }))
    .pipe(sourcemaps.write('../out-no', {
      includeContent: false,
      sourceRoot: '../test/samples'
    }))
    // .pipe(gulp.dest('out-no'))
    .pipe(through(function ({ sourceMap }) {
      ok(!sourceMap, 'no source map')
    }))
    .on('error', message => reject(new Error(message)))
    .on('end', () => resolve())
  }))

test('with invalid source map', () => new Promise((resolve, reject) => {
  gulp
    .src('test/samples/valid.js')
    .pipe(sourcemaps.init())
    .pipe(through(function (file) {
      file.sourceMap = 'dummy'
      this.queue(file)
    }))
    .pipe(ensureMappings({}))
    // .pipe(gulp.dest('out-invalid'))
    .pipe(through(function ({ sourceMap }) {
      strictEqual(sourceMap, 'dummy', 'invalid source map')
    }))
    .on('error', message => reject(new Error(message)))
    .on('end', () => resolve())
  }))

test('with empty source map mappings', () => new Promise((resolve, reject) => {
  gulp
    .src('test/samples/valid.js')
    .pipe(sourcemaps.init())
    .pipe(ensureMappings({ verbose: true }))
    .pipe(sourcemaps.write('../out-empty', {
      includeContent: false,
      sourceRoot: '../test/samples'
    }))
    // .pipe(gulp.dest('out-empty'))
    .pipe(through(function ({ sourceMap }) {
      ok(sourceMap.mappings, 'identity mappings')
    }))
    .on('error', message => reject(new Error(message)))
    .on('end', () => resolve())
  }))

test('with full source map mappings', () => new Promise((resolve, reject) => {
  gulp
    .src('test/samples/valid.js')
    .pipe(sourcemaps.init())
    .pipe(through(function (file) {
      file.sourceMap.mappings = 'AAAA'
      this.queue(file)
    }))
    .pipe(ensureMappings({ verbose: true }))
    .pipe(sourcemaps.write('../out-full', {
      includeContent: false,
      sourceRoot: '../test/samples'
    }))
    // .pipe(gulp.dest('out-full'))
    .pipe(through(function ({ sourceMap }) {
      strictEqual(sourceMap.mappings, 'AAAA', 'original mappings')
    }))
    .on('error', message => reject(new Error(message)))
    .on('end', () => resolve())
  }))

test('with filtered sources', () => new Promise((resolve, reject) => {
  gulp
    .src(['test/samples/valid.js', 'test/samples/ignored.js'])
    .pipe(sourcemaps.init())
    .pipe(ensureMappings({
      filter: ({ relative }) => relative.endsWith('valid.js')
    }))
    .pipe(sourcemaps.write('../out-filtered', {
      includeContent: false,
      sourceRoot: '../test/samples'
    }))
    // .pipe(gulp.dest('out-filtered'))
    .pipe(through(function ({ relative, sourceMap }) {
      if (relative.includes('valid.js')) {
        ok(sourceMap.mappings, `identity mappings: ${relative}`)
      } else {
        ok(!sourceMap.mappings, `no mappings: ${relative}`)
      }
    }))
    .on('error', message => reject(new Error(message)))
    .on('end', () => resolve())
  }))
