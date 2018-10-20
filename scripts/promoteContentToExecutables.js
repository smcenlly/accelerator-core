const {
  join,
} = require('path');
const {
  promisify,
} = require('util');

const rimraf = promisify(require('rimraf'));
const ncp = promisify(require('ncp'));
const writeFile = promisify(require('fs').writeFile);

const appDir = join(__dirname, '..', 'build-web');
const distDir = join(__dirname, '..', 'build-desktop');

const windowsDir = join(distDir, 'windows', 'resources', 'app');
const macOSDir = join(distDir, 'macOS', 'Electron.app', 'Contents', 'Resources', 'app');
const linuxDir = join(distDir, 'linux', 'resources', 'app');

const mainStr = // In the main process.
  `const {\n` +
    `\tapp,\n` +
    `\tBrowserWindow,\n`+
  `} = require('electron');\n` +
  `let win;\n` +
  `app.on('ready', () => {\n` +
    `\twin = new BrowserWindow();\n` +
    `\t// Load a local HTML file.\n` +
    '\twin.loadURL(`file://${__dirname}/index.html`);\n' +
    `\t// ready-to-show; should prevent slow load i.e. issue in Safari.\n` +
    `\twin.once('ready-to-show', () => {\n` +
      `\t\twin.show();\n` +
    `\t});\n` +
    `\t// Emitted when the window is closed.\n` +
    `\twin.on('closed', () => {\n` +
      `\t\t// Dereference the window object, usually you would store windows\n` +
      `\t\t// in an array if your app supports multi windows, this is the time\n` +
      `\t\t// when you should delete the corresponding element.\n` +
      `\t\twin = null;\n` +
    `\t});\n` +
  `});\n` +
  `// Quit when all windows are closed.\n` +
  `app.on('window-all-closed', () => {\n` +
    `\t// On macOS it is common for applications and their menu bar\n` +
    `\t// to stay active until the user quits explicitly with Cmd + Q.\n` +
    `\tif (process.platform !== 'darwin') {\n` +
      `\t\tapp.quit()\n` +
    `\t}\n` +
  `});`.replace(/\t/g, '  ');

const packageStr = JSON.stringify({
  name: process.env.ACCELERATOR_STORY_TITLE || 'Untitled Accelerator Story',
  version: process.env.ACCELERATOR_STORY_VERSION || '1.0.0',
  main: 'main.js',
});

const skipMacOS =
  process.argv.indexOf('--force-mac-build-on-windows') === -1 &&
  process.platform === 'win32';
if (skipMacOS) {
  console.log('Due to issues in the way Windows handles symlinks in zip ' +
              'archives, it is not possible to make macOS electron ' +
              'packages. You may override this by passing the ' +
              '--force-mac-build-on-windows to the ' +
              'promoteContentToExecutables script or the ' +
              'promote-content-to-executables npm task, but it will likely ' +
              'fail, and even if it does not, you should test to be ' +
              'absolutely sure it works.\n.\n');
}

Promise.all([
  rimraf(windowsDir),
  skipMacOS ? null : rimraf(macOSDir),
  rimraf(linuxDir),
]).then(() => {
  Promise.all([
    ncp(appDir, windowsDir),
    skipMacOS ? null : ncp(appDir, macOSDir),
    ncp(appDir, linuxDir),
  ]).then(() => {
    Promise.all([
      writeFile(join(linuxDir, 'package.json'), packageStr),
      skipMacOS ? null : writeFile(join(macOSDir, 'package.json'), packageStr),
      writeFile(join(windowsDir, 'package.json'), packageStr),
      writeFile(join(linuxDir, 'main.js'), mainStr),
      skipMacOS ? null : writeFile(join(macOSDir, 'main.js'), mainStr),
      writeFile(join(windowsDir, 'main.js'), mainStr),
    ]).then(() => {
      console.log('Electron bundles are ready.');
    }, (err) => {
      console.error(err.toString());
      throw err;
    });
  }, (err) => {
    console.error(err.toString());
    throw err;
  });
}, (err) => {
  console.error(err.toString());
  throw err;
});
