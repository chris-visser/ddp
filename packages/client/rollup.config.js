import ts from '@wessberg/rollup-plugin-ts'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'

// const isProduction = process.env.NODE_ENV === 'production'

export default [{
  input: 'src/main.ts',
  output: [{
    file: 'dist/cjs.js',
    format: 'cjs'
  }, {
    file: 'dist/esm-bundle.js',
    format: 'es',
  }],
  external: ['ws'],
  plugins: [
    ts({ tsconfig: 'tsconfig.build.json' }),
    nodeResolve(),
    commonjs()
  ]
},{
  input: 'src/main.ts',
  output: [{
    file: 'dist/esm-bundle.min.js',
    format: 'es',
    plugins: [terser()],
  }, {
    file: 'dist/global.min.js',
    format: 'iife',
    name: 'DDP',
  }],
  plugins: [
    ts({
      tsconfig: 'tsconfig.build.json'
    }),
    nodeResolve({
      browser: true
    }),
    commonjs()
  ]
}]
