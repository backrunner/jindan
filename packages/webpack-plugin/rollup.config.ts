import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

const plugins = [
  resolve({
    preferBuiltins: true,
    browser: false,
  }),
  commonjs(),
  typescript({ useTsconfigDeclarationDir: true }),
];

export default {
  input: './src/main.ts',
  output: [
    {
      file: pkg.main,
      name: pkg.name,
      format: 'cjs',
      exports: 'default',
      sourcemap: false,
    },
  ],
  external: ['webpack', 'webpack-sources', 'html-webpack-plugin'],
  watch: {
    include: './src/*.ts',
  },
  plugins,
};
