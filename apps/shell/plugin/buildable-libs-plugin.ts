import watch from 'node-watch';
import { execSync } from 'child_process';

function BuildableLibsPlugin(options) {
  this.options = options;
}

const defaultOptions: FileServerOptions = {
  buildTarget: 'shell:build',
  maxParallel: 3,
  parallel: true,
  withDeps: true,
};

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
      console.log('>>>>>> webpack: waiting to compiler');
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

export interface FileServerOptions {
  buildTarget: string;
  parallel: boolean;
  maxParallel: number;
  withDeps: boolean;
}

function getBuildTargetCommand(opts: FileServerOptions) {
  const cmd = [`npx nx run ${opts.buildTarget}`];
  if (opts.withDeps) {
    cmd.push(`--with-deps`);
  }
  if (opts.parallel) {
    cmd.push(`--parallel`);
  }
  if (opts.maxParallel) {
    cmd.push(`--maxParallel=${opts.maxParallel}`);
  }
  return cmd.join(' ');
}

export default function fileServerExecutor(
  opts: FileServerOptions = defaultOptions
) {
  let changed = true;
  let running = false;

  //TODO add filter back in
  // const fileFilter = getIgnoredGlobs(context.root).createFilter();
  watch('libs', { recursive: true }, () => {
    changed = true;
    console.log('>>>>>> libs changed');
    run();
  });
  watch('apps', { recursive: true }, () => {
    changed = true;
    console.log('>>>>>> apps changed');
    run();
  });

  function run() {
    console.log('>>>>>> running - ', { changed, running, currentlyRunning });
    if (changed && !running && currentlyRunning !== 'webpack') {
      changed = false;
      running = true;
      try {
        const cmd = getBuildTargetCommand(opts);
        console.log('++++++ ' + cmd);
        execSync(
          `npx nx run-many --target=build --projects=buildable-header,buildable-button --parallel`,
          {
            stdio: [0, 1, 2],
          }
        );
        console.log('++++++ two');
      } catch (e) {
        console.log('>>>> ERROR 1: ', e);
      }
      running = false;
      currentlyRunning = 'none';
      console.log('>>>>>> build finished');
      //TODO this timer needs to be outside of the "if"
      setTimeout(() => {
        console.log('>>>>>> build timer fired');
        run();
      }, 1000);
    }
  }
  run();
}
