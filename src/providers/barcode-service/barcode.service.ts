import { Injectable } from '@angular/core';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

@Injectable({ providedIn: 'root' })
export class BarcodeService {

  async startScan(): Promise<string[]> {
    // Check for required permissions, else prompt request
    const status = await BarcodeScanner.checkPermissions();
    console.log('Inside start scan function status variable value :::', status);
    if (status.camera !== 'granted') {
      await BarcodeScanner.requestPermissions();
    }

    //  Start the scan (Native overlay)
    const { barcodes } = await BarcodeScanner.scan();
    return barcodes.map(b => b.displayValue);
  }

  // To impress recruiters: Show you can stop/cleanup native resources
  async stopScan() {
    await BarcodeScanner.stopScan();
  }
}
