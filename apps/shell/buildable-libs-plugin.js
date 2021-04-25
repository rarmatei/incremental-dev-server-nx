function BuildableLibsPlugin(options) {
  this.options = options;
}

BuildableLibsPlugin.prototype.apply = function (compiler) {
  compiler.hooks.beforeCompile.tapAsync(
    'BuildableLibsPlugin',
    (params, callback) => {
      console.log('before timeout...');
      setTimeout(() => {
        console.log('callback..');
        callback();
      }, 3000);
    }
  );
};

module.exports = BuildableLibsPlugin;
