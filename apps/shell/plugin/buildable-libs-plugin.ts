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

startWatchingBuildableLibs();
buildAllSync();

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
      console.log('>>>>>> webpack: pausing compilation...');
      setTimeout(() => {
        console.log('>>>>>> webpack: resuming compilation...');
        callback();
      }, 10000);
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

function startWatchingBuildableLibs() {
  let changed = true;
  let running = false;

  watch('libs', { recursive: true }, async () => {
    changed = true;
    console.log('>>>>>> libs changed');
    await run();
  });

  async function run() {
    console.log('>>>>>> running - ', { changed, running, currentlyRunning });
    //if something changed and webpack is running, try again later
    if (currentlyRunning === 'webpack') {
      setTimeout(async () => {
        await run();
      }, 1000);
      return;
    }
    if (changed && !running) {
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
      //if something changed in the meantime, immediately re-build before re-triggering the webpack hook
      if (changed) {
        await run();
      }
      currentlyRunning = 'none';
    }
  }
}

//TODO for demo: add withLogs, fakeLongWebpack, fakeLongBuildable

function buildAllSync() {
  for (let i = 0; i < 20; i++) {
    execSync(
      `npx nx run-many --target=build --projects=buildable-header,buildable-button --parallel`,
      {
        stdio: [0, 1, 2],
      }
    );
    console.log('++++ finished initial build!   ', i);
  }
}

function invoke(cmd: string) {
  return new Promise((resolve) => {
    //TODO make this output to stdout
    exec(cmd, (error, stdout, stderr) => {
      resolve(stdout);
    });
  });
}

/*
Some remaining issues:
1. it only watches "libs" now - should we watch everything? (it won't work with a custom workspace layout)
2. needs to accept more options - at least the options for the current @nrwl/web:dev-server (like another custom webpack config)
3. angular equivalent?
 */
