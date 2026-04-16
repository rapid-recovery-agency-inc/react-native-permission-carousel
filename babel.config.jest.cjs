module.exports = {
  presets: [['@babel/preset-typescript', { allExtensions: true, isTSX: true }]],
  plugins: [
    '@babel/plugin-transform-modules-commonjs',
    '@babel/plugin-transform-react-jsx',
    '@babel/plugin-transform-class-properties',
    '@babel/plugin-transform-optional-chaining',
    '@babel/plugin-transform-nullish-coalescing-operator',
  ],
};
