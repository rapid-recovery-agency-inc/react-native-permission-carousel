module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {},
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-community|@react-native/jest-preset|react-native-reanimated|react-native-svg|react-native-modal|react-native-vector-icons)/)',
  ],
  setupFiles: ['./jest.setup.js'],
};
