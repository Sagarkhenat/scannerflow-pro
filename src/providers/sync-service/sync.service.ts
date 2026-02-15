// src/app/services/sync.service.ts
import { Injectable, effect } from '@angular/core';
import { Network } from '@capacitor/network';
import { ScanStateService } from '../providers';
import { MOCK_INVENTORY } from 'src/app/data/mock-inventory';

@Injectable({ providedIn: 'root' })
export class SyncService {
  constructor(private scanState: ScanStateService) {
    this.initNetworkListener();
  }

  private async initNetworkListener() {
    // Listen for status changes
    Network.addListener('networkStatusChange', status => {
      if (status.connected) {
        this.processQueue();
      }
    });
  }

  async processQueue() {
    const pending = this.scanState.pendingScans();

    for (const item of pending) {
      try {
        // Simulate an API call that might fail
        await this.uploadScan(item);
        this.scanState.updateStatus(item.barcode, 'synced');
      } catch (error: any) {
        // Handle different error types
        if (error.status === 404) {
          console.error('Item not found in inventory');
          this.scanState.updateStatus(item.barcode, 'error');
        } else {
          // For network timeouts, keep it as 'pending' to retry later
          console.warn('Network timeout, will retry when connection is stable');
        }
      }
    }
  }

  // private async uploadScan(item: any): Promise<void> {
  //   // Simulate a 1-second network request
  //   return new Promise((resolve, reject) => {
  //     setTimeout(() => {
  //       // Simulate a random 404 error for testing your Error State logic
  //       Math.random() > 0.8
  //         ? reject({ status: 404 })
  //         : resolve();
  //     }, 1000);
  //   });
  // }

  private async uploadScan(item: any): Promise<void> {
    return new Promise((resolve, reject) => {
      // Simulate network latency
      const latency = Math.floor(Math.random() * 2000) + 500;

      setTimeout(() => {
        // 1. Simulate a 404 Error (Item not in mock inventory)
        const exists = MOCK_INVENTORY.find(i => i.id === item.barcode);

        if (!exists) {
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
        resolve();
      }, latency);
    });
  }

  private mockApiCall(data: any) {
    return new Promise(resolve => setTimeout(resolve, 1000));
  }
}
