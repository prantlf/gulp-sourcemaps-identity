export default {
  input: 'lib/index.js',
  output: { file: 'lib/index.cjs', format: 'cjs', sourcemap: true },
  external: ['event-stream', 'fancy-log', 'acorn', 'source-map']
}
