const nrwlConfig = require('@nrwl/react/plugins/webpack.js'); // require the main @nrwl/react/plugins/webpack configuration function.
const BuildableLibsPlugin = require('./buildable-libs-plugin');

module.exports = (config) => {
  nrwlConfig(config);

  return {
    ...config,
    plugins: [...config.plugins, new BuildableLibsPlugin()],
  };
};
