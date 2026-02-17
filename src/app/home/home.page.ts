import { Component, inject,CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Platform } from '@ionic/angular/standalone';
import { IonContent,IonProgressBar,IonCard,IonCardContent, IonList,
          IonFab, IonFabButton, IonIcon,IonText, IonGrid, IonRow,IonCol,IonHeader, } from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { scanOutline } from 'ionicons/icons';
import { PercentPipe } from '@angular/common';
import {CommonModule} from '@angular/common';

import { BarcodeService,ScanStateService,SyncService } from 'src/providers/providers';
import { ScanItemComponent } from '../component/scan-item/scan-item.component';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, ScanItemComponent, PercentPipe,
            IonContent,IonProgressBar,IonCard,IonCardContent,
            IonList,IonFab, IonFabButton, IonIcon,
            IonText, IonGrid, IonRow, IonCol,IonHeader],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePage {

  // Inject the service as public so the template can see it
  public scanState = inject(ScanStateService);
  private syncService = inject(SyncService);
  private barcodeService = inject(BarcodeService);
  private platform = inject(Platform);

  // Property to check if we are on a native device
  isNative = this.platform.is('hybrid');

  constructor() {
    // Registering the icon so it renders in standalone mode
    addIcons({ scanOutline });
  }

  mockScan(code: string) {
    console.log('Simulating scan for browser testing...', code);
    this.scanState.addScan(code);
    // This will trigger the SyncService automatically
  }

  async startNewScan() {
    try {
      const barcodes = await this.barcodeService.startScan();
      barcodes.forEach(code => {
        this.scanState.addScan(code);
      });
    } catch (err) {
      console.error('Scanning failed', err);
    }
  }

  retrySync(item: any) {
    this.scanState.updateStatus(item.barcode, 'pending');
    // Trigger the queue processing manually
    (this.syncService as any).processQueue();
  }
}
