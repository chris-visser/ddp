import { nodeResolve } from '@rollup/plugin-node-resolve'
import config from './rollup.config.base'

export default {
  ...config,
  output: {
    file: 'dist/ddp-client.browser.js',
    format: 'umd',
    name: 'DDP',
  },
  plugins: [
    ...config.plugins,
    nodeResolve({
      browser: true
    }),
  ]
}
