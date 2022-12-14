import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import sourceMaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';
import filesize from 'rollup-plugin-filesize';
import { babel } from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const plugins = [
  json(),
  resolve({
    preferBuiltins: false,
    browser: true,
  }),
  commonjs(),
  babel({ babelHelpers: 'runtime', presets: ['@babel/preset-env'], plugins: ['@babel/plugin-transform-runtime'] }),
  typescript({ useTsconfigDeclarationDir: true }),
  sourceMaps(),
];

if (process.env.NODE_ENV === 'production') {
  plugins.push(filesize({ showMinifiedSize: false, showBrotliSize: true }), terser());
}

export default {
  input: `src/main.ts`,
  output: [
    { file: pkg.main, name: 'JinDan', format: 'iife', sourcemap: true },
    { file: pkg.module, name: pkg.name, format: 'esm', sourcemap: true },
  ],
  external: [],
  watch: {
    include: 'src/**',
  },
  plugins,
};
