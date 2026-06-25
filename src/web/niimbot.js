let sharedInstance = null;

export class NiimbotTransport {
  constructor() {
    this.client = null;
    this.connected = false;
    this.deviceName = '';
    this.printerInfo = { battery: null };
    this.firmware = null;
    this.onDisconnect = null;
  }

  static getShared() {
    if (!sharedInstance) {
      sharedInstance = new NiimbotTransport();
    }
    return sharedInstance;
  }

  static isAvailable() {
    return 'bluetooth' in navigator && typeof window.niimbluelib !== 'undefined';
  }

  async connect() {
    if (!NiimbotTransport.isAvailable()) {
      throw new Error('NIIMBOT Bluetooth support is unavailable');
    }

    this.client = new window.niimbluelib.NiimbotBluetoothClient();
    this.client.on('disconnect', () => {
      this.connected = false;
      if (this.onDisconnect) this.onDisconnect();
    });

    // Surface niimbluelib handshake events so a red-printer/green-web mismatch
    // is diagnosable without opening devtools. onLog is wired in app.js.
    const log = (msg) => { console.log('[niimbot]', msg); if (this.onLog) this.onLog(msg); };
    this.client.on('connect', () => log('BLE link up'));
    this.client.on('printerinfofetched', () => {
      this.firmware = this.client.info?.softwareVersion || null;
      log('Printer handshake OK');
    });
    this.client.on('heartbeat', () => log('Heartbeat OK'));
    this.client.on('heartbeatfailed', () => log('Heartbeat FAILED — printer not responding'));

    let result;
    try {
      result = await this.client.connect();
    } catch (e) {
      // niimbluelib fails to find its channel characteristic on non-Niimbot
      // printers. Make the cause actionable instead of a cryptic lib error.
      if (/characteristic/i.test(e?.message || '')) {
        throw new Error('Not a Niimbot printer. Open Print Settings and set Make to Auto (or the correct make), then reconnect.');
      }
      throw e;
    }
    this.deviceName = result?.deviceName || result?.name || 'NIIMBOT';
    this.connected = this.client.isConnected();
    return this.connected;
  }

  async disconnect() {
    if (this.client) await this.client.disconnect();
    this.client = null;
    this.connected = false;
  }

  isConnected() {
    return this.connected && this.client?.isConnected();
  }

  getDeviceName() {
    return this.deviceName;
  }

  async printRaster(rasterData, options = {}) {
    if (!this.isConnected()) throw new Error('NIIMBOT printer is not connected');

    const canvas = document.createElement('canvas');
    canvas.width = rasterData.widthBytes * 8;
    canvas.height = rasterData.heightLines;
    const context = canvas.getContext('2d');
    const image = context.createImageData(canvas.width, canvas.height);

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const byte = rasterData.data[y * rasterData.widthBytes + Math.floor(x / 8)];
        const black = (byte & (1 << (7 - (x % 8)))) !== 0;
        const offset = (y * canvas.width + x) * 4;
        const value = black ? 0 : 255;
        image.data[offset] = value;
        image.data[offset + 1] = value;
        image.data[offset + 2] = value;
        image.data[offset + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);

    const encoded = window.niimbluelib.ImageEncoder.encodeCanvas(canvas, 'top');
    const printTaskName = this.client.getPrintTaskType() || options.niimbotTask || 'B1';
    const task = this.client.abstraction.newPrintTask(printTaskName, {
      density: Math.max(1, Math.min(5, Math.round((options.density || 6) * 5 / 8))),
      totalPages: 1,
      statusPollIntervalMs: 150,
      statusTimeoutMs: 10000,
    });

    try {
      await task.printInit();
      await task.printPage(encoded, 1);
      await task.waitForPageFinished();
      await task.waitForFinished();
    } finally {
      await task.printEnd();
    }
  }
}
