import { nodeResolve } from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import config from './rollup.config.base'

export default {
  ...config,
  output: {
    file: 'dist/ddp-client.global.min.js',
    format: 'iife',
    name: 'DDP',
    plugins: [terser()]
  },
  plugins: [
    ...config.plugins,
    nodeResolve({
      browser: true
    }),
  ]
}
