import watch from 'node-watch';
import { exec, execSync, spawn } from 'child_process';

function BuildableLibsPlugin(options) {
  this.options = options;
}

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

  //TODO add filter back in
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
          console.log('++++ finished invoke!');
        }
      } catch (e) {}
      running = false;
      currentlyRunning = 'none';
      console.log('>>>>>> build finished');
      setTimeout(async () => {
        console.log('>>>>>> build timer fired');
        await run();
      }, 1000);
    }
  }
  await run();
}

function invoke(cmd: string) {
  return new Promise((resolve) => {
    exec(cmd, (error, stdout, stderr) => {
      resolve(stdout);
    });
  });
}
