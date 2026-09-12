// metro.config.js — SVG support.
//
// Lets `import Logo from '../assets/brand/logo.svg'` return a React component
// backed by react-native-svg, so brand art stays vector (crisp at any density,
// tintable via props) instead of shipping @1x/@2x/@3x rasters.
//
// The two resolver changes are a pair: `svg` has to leave assetExts (or Metro
// treats it as a static image file) and join sourceExts (so it goes through the
// transformer as a module).

const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...resolver.sourceExts, 'svg'],
  };

  return config;
})();
