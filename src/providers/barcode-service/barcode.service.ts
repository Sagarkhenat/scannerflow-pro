import { Injectable,signal } from '@angular/core';
import { BarcodeScanner,LensFacing } from '@capacitor-mlkit/barcode-scanning';


import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { ScanStateService,FeedbackService } from '../providers';

@Injectable({ providedIn: 'root' })
export class BarcodeService {

  //public scanCount = computed(() => this.scanState.scanList().length);
  public scanCount = this.scanState.totalCount;
  public isFlashing = signal(false);

  // Signal to track torch status for UI icons
  public isTorchOn = signal(false);
  private toastTimeout: any;

  public lastScannedValue = signal<string | null>(null);

  constructor(private scanState:ScanStateService, private feedback:FeedbackService){
  }



  async startScanner(): Promise<string[]> {
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


  async startBatchScan() {

    const status = await BarcodeScanner.checkPermissions();
    console.log('Inside start scan function status variable value :::', status);

    if(status.camera !== 'granted') {
      await BarcodeScanner.requestPermissions();
    }else{}

    console.log('scanState is scanning boolean output BEFORE start batch scan :::', this.scanState.isScanning());

    // 1. CLEAR existing listeners first to prevent "Zombies"
    await BarcodeScanner.removeAllListeners();

    // Add the Listener: This fires every time a barcode is detected
    // The 'barcodeScanned' listener returns a single barcode object,
    // and we access '.barcode' to get the details.
    await BarcodeScanner.addListener('barcodesScanned', async (event) => {

      console.log('Barcodes scanned event generated value :::', event);

      // Since it's an array, we loop through and add each one
      if (event && event.barcodes && event.barcodes.length > 0) {

        for (const barcode of event.barcodes) {
          // Passing only the string 'displayValue' to match the addScan(string) signature

          // Trigger the visual success flash animation
          this.triggerFlash(barcode.displayValue);

          console.log('barcode variable inside start batch scan :::', barcode);
          await this.scanState.addScan(barcode.displayValue);
        }

      }else{}
    });

    // Prepare UI: Make background transparent and show overlay
    this.scanState.isScanning.set(true);
    document.body.classList.add('scanning-active');

    // Add a small delay to let Angular render the DOM before the camera starts
    await new Promise(resolve => setTimeout(resolve, 300));


    console.log('scanState is scanning boolean output AFTER start batch scan :::', this.scanState.isScanning());

    // Start the hardware camera SECOND
    // Now that the listener is ready, it's safe to power on the sensor.
    await BarcodeScanner.startScan  ({
      formats: [],
      lensFacing: LensFacing.Back
    });

  }

  private async triggerFlash(scannedValue?: string) {

    if (scannedValue) {

      //Lookup the product name using your existing service
      const productInfo = this.scanState.lookupProduct(scannedValue);

      //Set the toast to show the Name (or barcode if name isn't found)
      this.lastScannedValue.set(productInfo.name || scannedValue);

      // Clear previous timeout if user scans rapidly
      // Reset toast timer so it stays visible for 2 seconds
      if (this.toastTimeout) clearTimeout(this.toastTimeout);

      // Auto-hide the toast after 2 seconds
      this.toastTimeout = setTimeout(() => {
        this.lastScannedValue.set(null);
      }, 2000);

    }else{}

    this.isFlashing.set(true);

    //Physical Vibration
    await Haptics.impact({ style: ImpactStyle.Light });

    // Automatically turn off the class so it can be re-triggered
    setTimeout(() => this.isFlashing.set(false), 300);
  }

  async toggleFlashlight() {
    try {
      await BarcodeScanner.toggleTorch();
      this.isTorchOn.update(state => !state);
    } catch (err) {
      console.warn('Torch toggle failed or unsupported on this device:', err);
      console.error('Torch not available on this device', err);
    }
  }

  async stopBatchScan() {


    // Tell the hardware to stop the camera and listener
    await BarcodeScanner.removeAllListeners();
    await BarcodeScanner.stopScan();

    // Remove the 'scanning-active' class from the body
    // to bring back the app's background/UI colors.
    document.querySelector('body')?.classList.remove('scanning-active');

    // Update your local view status signal to return to the main list
    // This will automatically hide the overlay via @if
    this.scanState.isScanning.set(false);

    // Provide a final "Success" haptic to confirm
    // the batch is saved.
    await this.feedback.success();

    console.log(`Returned to Home. ${this.scanState.totalCount()} items in list.`);

  }

  // Safety: Ensure camera turns off if user navigates back via hardware button
  ngOnDestroy() {
    this.stopBatchScan();
  }

}
