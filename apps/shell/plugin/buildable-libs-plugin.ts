import watch from 'node-watch';
import { execSync } from 'child_process';

function BuildableLibsPlugin(options) {
  this.options = options;
}

let currentlyRunning: 'none' | 'build-process' | 'webpack' = 'none';

function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

console.log('++++ calling file executor up here');
try {
  fileServerExecutor();
} catch (e) {
  console.log('>>>> ERROR: ', e);
}

BuildableLibsPlugin.prototype.apply = function (compiler) {
  compiler.hooks.beforeCompile.tapAsync(
    'BuildableLibsPlugin',
    async (params, callback) => {
      console.log('>>>>>> webpack: waiting to compile');
      while (currentlyRunning !== 'none') await sleep(1000);
      console.log('>>>>>> webpack: compiling');
      currentlyRunning = 'webpack';
      callback();
    }
  );

  compiler.hooks.done.tapAsync(
    'BuildableLibsPlugin',
    async (stats, callback) => {
      currentlyRunning = 'none';
      console.log('>>>>>> webpack: done');
      callback();
    }
  );
};

module.exports = BuildableLibsPlugin;

export default function fileServerExecutor() {
  let changed = true;
  let running = false;

  //TODO add filter back in
  watch('libs', { recursive: true }, () => {
    changed = true;
    console.log('>>>>>> libs changed');
    run();
  });

  function run() {
    console.log('>>>>>> running - ', { changed, running, currentlyRunning });
    if (changed && !running && currentlyRunning !== 'webpack') {
      changed = false;
      running = true;
      try {
        execSync(
          `npx nx run-many --target=build --projects=buildable-header,buildable-button --parallel`,
          {
            stdio: [0, 1, 2],
          }
        );
      } catch (e) {}
      running = false;
      currentlyRunning = 'none';
      console.log('>>>>>> build finished');
      setTimeout(() => {
        console.log('>>>>>> build timer fired');
        run();
      }, 1000);
    }
  }
  run();
}
