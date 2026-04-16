module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  overrides: [
    {
      test: /\.tsx?$/,
      plugins: [
        [
          '@babel/plugin-transform-typescript',
          {
            isTSX: true,
          },
        ],
      ],
    },
  ],
};
