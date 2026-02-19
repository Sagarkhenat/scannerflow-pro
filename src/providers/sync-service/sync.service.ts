import { Injectable, effect } from '@angular/core';
import { Network, ConnectionStatus } from '@capacitor/network';
import { ScanStateService } from '../providers';
import { MOCK_INVENTORY } from 'src/app/data/mock-inventory';
import { ScannedItem } from '../scan-state-service/scan-state.service';
import { ToastController } from '@ionic/angular/standalone';

@Injectable({ providedIn: 'root' })
export class SyncService {
  constructor(private scanState: ScanStateService, private toastCtrl: ToastController) {
    this.initNetworkListener();
  }

  private async initNetworkListener() {
    // Listen for status changes
    Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
      if (status.connected) {
        this.processQueue();
      }else{}
    });
  }

  public async processQueue() {
    const pending = this.scanState.pendingScans();

    console.log('pending variable value inside process queue :::', pending);

    if (pending.length === 0) return; // Optional: don't update if nothing was processed

    for (const item of pending) {
      try {
        // Simulate an API call that might fail
        // Capture the product details during the upload simulation
        const product = await this.uploadScan(item);

        console.log('Passing for update status the product value ::', product);

        console.log('Passing to update status the barcode value ::', item.barcode);

        // Update the state with BOTH the status and the retrieved name
        // You'll need an updateItem method in your service to handle multiple fields
        this.scanState.updateStatus(item.barcode, 'synced', product.name);

      } catch (error: any) {
        // Handle different error types
        if (error.status === 404) {
          console.log('Item not found in inventory condition :::');
          console.error('Item not found in inventory');
          this.scanState.updateStatus(item.barcode, 'error', 'Product Not Found');

          // Trigger the error Toast
          this.showErrorToast(`Barcode ${item.barcode} not recognized.`);

        } else {
          // For network timeouts, keep it as 'pending' to retry later
          console.warn('Network timeout, will retry when connection is stable');
          this.scanState.updateStatus(item.barcode, 'error');
        }
      }
    }

    // After the loop finishes all items
    this.scanState.updateLastSynced();
    this.scanState.updateLastSynced();

  }

private async showErrorToast(message: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: 'danger',
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
}

private async uploadScan(item: any):Promise<any> {

    return new Promise((resolve, reject) => {
      // Simulate network latency
      const latency = Math.floor(Math.random() * 2000) + 500;

      console.log('latency variable value generated during upload scan function :::', latency);

      setTimeout(() => {
        // Simulate a 404 Error (Item not in mock inventory)
        // Ensure MOCK_INVENTORY is an array in its source file
        const exists = MOCK_INVENTORY.find(i => i.id === item.barcode);

        if (!exists || item.barcode === '99999') {
          return reject({ status: 404, message: 'Item Not Found' });
        }

        // 2. Simulate a Random 500 Error (Server Overload)
        if (Math.random() > 0.85) {
          return reject({ status: 500, message: 'Internal Server Error' });
        }

        if (item.barcode === '99999') {
          reject({ status: 404 });
        }

        // 3. Success
        console.log(`✅ Success: ${exists.name} synced.`);
        resolve(exists);
      }, latency);
    });
  }

  private mockApiCall(data: any) {
    return new Promise(resolve => setTimeout(resolve, 1000));
  }
}
