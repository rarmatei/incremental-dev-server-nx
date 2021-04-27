import watch from 'node-watch';
import { exec, execSync, spawn } from 'child_process';

function BuildableLibsPlugin(options) {
  this.options = options;
}

//TODO do I need all of these? or just "build-process" and "none"
let currentlyRunning: 'none' | 'build-process' | 'webpack' = 'none';

function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

console.log('++++ calling file executor up here');
try {
  fileServerExecutor().then(() => {
    console.log('+++ finished initial serve');
  });
} catch (e) {
  console.log('>>>> ERROR: ', e);
}

BuildableLibsPlugin.prototype.apply = function (compiler) {
  //TODO do an initial build outside the plugin

  compiler.hooks.beforeCompile.tapAsync(
    'BuildableLibsPlugin',
    async (params, callback) => {
      console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      console.log(
        '>>>>>> webpack: waiting to compile - currently running: ',
        currentlyRunning
      );
      console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      while (currentlyRunning === 'build-process') {
        console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
        console.log('SLEEPING');
        console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
        await sleep(1000);
      }
      console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      console.log('>>>>>> webpack: compiling');
      console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
      console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
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

async function fileServerExecutor() {
  let changed = true;
  let running = false;

  watch('libs', { recursive: true }, async () => {
    changed = true;
    console.log('>>>>>> libs changed');
    await run();
  });

  async function run() {
    console.log('>>>>>> running - ', { changed, running, currentlyRunning });
    if (changed && !running && currentlyRunning !== 'webpack') {
      currentlyRunning = 'build-process';
      changed = false;
      running = true;
      try {
        for (let i = 0; i < 20; i++) {
          await invoke(
            `npx nx run-many --target=build --projects=buildable-header,buildable-button --parallel`
          );
          console.log('++++ finished invoke!   ', i);
        }
        // eslint-disable-next-line no-empty
      } catch (e) {}
      running = false;
      console.log('>>>>>> build finished');
      if (changed) {
        await run();
      }
      currentlyRunning = 'none';
    }
  }
}

function invoke(cmd: string) {
  return new Promise((resolve) => {
    exec(cmd, (error, stdout, stderr) => {
      resolve(stdout);
    });
  });
}
