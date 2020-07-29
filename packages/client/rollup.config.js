import ts from '@wessberg/rollup-plugin-ts'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'

// const isProduction = process.env.NODE_ENV === 'production'

export default {
  input: 'src/main.ts',
  output: [{
    file: 'dist/cjs.js',
    format: 'cjs'
  }, {
    file: 'dist/esm-bundle.js',
    format: 'es'
  }, {
    file: 'dist/esm-bundle.min.js',
    format: 'es',
    plugins: [terser()]
  }, {
    file: 'dist/global.min.js',
    format: 'iife',
    plugins: [terser()],
    name: 'DDPClient',
    globals: {
      ws: 'ws'
    }
  }],
  external: ['ws'],
  plugins: [
    ts({
      tsconfig: 'tsconfig.build.json'
    }),
    nodeResolve(),
    commonjs()
  ]
}
