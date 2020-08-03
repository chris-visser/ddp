import { nodeResolve } from '@rollup/plugin-node-resolve'
import config from './rollup.config.base'

export default {
  ...config,
  external: ['ws', 'ejson', 'eventemitter3', 'shorthash', 'isomorphic-ws'],
  output: {
    file: 'dist/ddp-client.node.js',
    format: 'cjs',
    name: 'DDP',
  },
  plugins: [
    ...config.plugins,
    nodeResolve(),
  ]
}
