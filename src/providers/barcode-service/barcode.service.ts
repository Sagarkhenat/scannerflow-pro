import { Injectable } from '@angular/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

@Injectable({ providedIn: 'root' })
export class BarcodeService {

  async startScan(): Promise<string[]> {
    // 1. Check/Request permissions
    const status = await BarcodeScanner.checkPermissions();
    if (status.camera !== 'granted') {
      await BarcodeScanner.requestPermissions();
    }

    // 2. Start the scan (Native overlay)
    const { barcodes } = await BarcodeScanner.scan();
    return barcodes.map(b => b.displayValue);
  }

  // To impress recruiters: Show you can stop/cleanup native resources
  async stopScan() {
    await BarcodeScanner.stopScan();
  }
}
