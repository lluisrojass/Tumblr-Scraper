const { BrowserWindow, app } = require('electron');
const { resolve } = require('path');
const { format } = require('url');
const log = require('electron-log');
const getPort = require('get-port');

log.transports.file.file = __dirname + '/app.log';
log.transports.file.level = 'info';

if (process.env.NODE_ENV === 'development') {
  require('electron-reload')(__dirname);
}

const serverOnlyMode = process.env.SERVER_ONLY === '1';
let clientWindow;
let serverWindow;

function onServerClosed() {
  serverWindow = null;
  log.info('application server closed');
  if (clientWindow && !clientWindow.isDestroyed()) {
    clientWindow.destroy();
  }
}

function onClientClosed() {
  clientWindow = null;
  log.info('application client closed');
  if (serverWindow && !serverWindow.isDestroyed()) {
    serverWindow.destroy();
  }
}

function destroyAllWindows() {
  if (clientWindow && !clientWindow.isDestroyed()) {
    clientWindow.destroy();
  }
  if (serverWindow && !serverWindow.isDestroyed()) {
    serverWindow.destroy();
  }
}

function createServerWindow(port) {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      additionalArguments: [`PORT:${port}`]
    }
  });

  win.loadURL(format({
    pathname: resolve(__dirname, './server/_.html'),
    protocol: 'file:',
    slashes: true,
  }));
    
  win.on('closed', onServerClosed);
  win.webContents.on('crashed', destroyAllWindows);

  return win;
}

function createClientWindow(port) {
  const win = new BrowserWindow({
    width: 1000,
    height: 500,
    minWidth: 1000,
    minHeight: 500,
    backgroundColor: '#F9F9F9',
    titleBarStyle: 'hiddenInset',
    title: 'Tumblr Scraper',
    scrollBounce: true,
    darkTheme: true,
    movable: true,
    webPreferences: {
      additionalArguments: [`PORT:${port}`]
    }
  });

  win.loadURL(format({
    pathname: resolve(__dirname, './index.html'),
    protocol: 'file',
    slashes: true
  }));

  if (process.env.NODE_ENV === 'development')
    win.webContents.openDevTools();

  win.webContents.on('crashed', destroyAllWindows);
  win.on('closed', onClientClosed);
    
  return win;
}

app.on('ready', async () => {
  const port = await getPort({ port: 3000 });
  log.info(`application startup, on port ${port}`);
  serverWindow = createServerWindow(port);
  serverWindow.once('ready-to-show', () => {
    /* server successfully started up */
    if (!serverOnlyMode) {
      clientWindow = createClientWindow(port);
    }
  });
});