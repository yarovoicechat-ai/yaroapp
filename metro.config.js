const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// D:\YaroApp\node_modules is a Windows directory junction pointing to
// D:\meethichaatapp\node_modules. Metro does not follow junctions on Windows,
// so we add the real path as an extra watchFolders and nodeModulesPaths so the
// resolver can find @babel/runtime and other packages that are not physically
// inside this project directory.
const junctionTarget = 'D:\\meethichaatapp\\node_modules';

module.exports = mergeConfig(defaultConfig, {
  // Keep release bundling within CI/Windows memory limits.
  maxWorkers: 1,
  watchFolders: [junctionTarget],
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    // Native build outputs contain no app JavaScript and can overwhelm Windows crawling.
    blockList: [
      ...[defaultConfig.resolver.blockList].flat().filter(Boolean),
      /[/\\]android[/\\](?:.*[/\\])?(?:build|\.cxx|\.gradle)[/\\]/,
    ],
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      junctionTarget,
    ],
    assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
  },
});
