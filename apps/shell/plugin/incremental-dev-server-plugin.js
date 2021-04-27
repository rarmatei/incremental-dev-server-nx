"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_watch_1 = __importDefault(require("node-watch"));
const child_process_1 = require("child_process");
const debugOptions = {
    debugLogging: true,
    debugWebpackThrottlingMs: 0,
    debugBuildableLibsMultiPasses: 20,
};
function IncrementalDevServerPlugin(options) {
    this.options = options;
}
let currentlyRunning = 'none';
function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
const buildCmd = `npx nx run-many --target=build --projects=buildable-header,buildable-button --parallel`;
buildAllSync();
startWatchingBuildableLibs();
IncrementalDevServerPlugin.prototype.apply = function (compiler) {
    compiler.hooks.beforeCompile.tapAsync('IncrementalDevServerPlugin', async (params, callback) => {
        log('>>>>>> 📂 webpack wants to compile - 🍌 banana held by ', currentlyRunning);
        while (currentlyRunning === 'build-process') {
            log('📂 😴 webpack sleeping');
            await sleep(1000);
        }
        log('>>>>>> 📂 🏋️ webpack: started compilation');
        currentlyRunning = 'webpack';
        if (debugOptions.debugWebpackThrottlingMs) {
            log('>>>>>> 📂 ⌛ webpack: throttling compilation...');
            setTimeout(() => {
                log('>>>>>> 📂 👍 webpack: resuming compilation...');
                callback();
            }, debugOptions.debugWebpackThrottlingMs);
        }
        else {
            callback();
        }
    });
    compiler.hooks.done.tapAsync('IncrementalDevServerPlugin', async (stats, callback) => {
        currentlyRunning = 'none';
        log('>>>>>> 📂 ⚡ webpack: done');
        callback();
    });
};
module.exports = IncrementalDevServerPlugin;
function startWatchingBuildableLibs() {
    let changed = true;
    let running = false;
    node_watch_1.default('libs', { recursive: true }, async () => {
        changed = true;
        log('>>>>>> 🧱 🔥 libs changed');
        await run();
    });
    async function run() {
        log('>>>>>> 🧱 ⌛ buildable process wants to run - ', {
            changed,
            running,
            currentlyRunning,
        });
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
                if (debugOptions.debugBuildableLibsMultiPasses) {
                    for (let i = 0; i < debugOptions.debugBuildableLibsMultiPasses; i++) {
                        await invokeAsync(buildCmd);
                        log('>>> 🧱 finished invocation pass: ', i);
                    }
                }
                else {
                    await invokeAsync(buildCmd);
                }
                // eslint-disable-next-line no-empty
            }
            catch (e) { }
            running = false;
            log('>>>>>> 🧱 build finished 👍');
            //if something changed in the meantime, immediately re-build before re-triggering the webpack hook
            if (changed) {
                log('>>>>>> 🧱 😱 file was changed while building. Triggering another build.');
                await run();
            }
            currentlyRunning = 'none';
        }
    }
}
function buildAllSync() {
    child_process_1.execSync(buildCmd, {
        stdio: [0, 1, 2],
    });
}
function invokeAsync(cmd) {
    return new Promise((resolve) => {
        //TODO make this output to stdout
        child_process_1.exec(cmd, (error, stdout, stderr) => {
            resolve(stdout);
        });
    });
}
function log(...args) {
    if (debugOptions.debugLogging) {
        console.debug(...args);
    }
}
/*
Some remaining issues:
1. it only watches "libs" now - should we watch everything? (it won't work with a custom workspace layout)
2. needs to accept more options - at least the options for the current @nrwl/web:dev-server (like another custom webpack config)
3. angular equivalent?
 */
