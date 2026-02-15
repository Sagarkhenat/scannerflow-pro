import { Component, inject,CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IonContent,IonProgressBar,IonCard,
        IonCardContent,IonList,IonFab, IonFabButton, IonIcon,IonText, IonGrid, IonRow, IonCol } from '@ionic/angular/standalone';

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
            IonText, IonGrid, IonRow, IonCol],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePage {

  // Inject the service as public so the template can see it
  public scanState = inject(ScanStateService);
  private syncService = inject(SyncService);
  private barcodeService = inject(BarcodeService);

  constructor() {
    // Register the icon so it renders in standalone mode
    addIcons({ scanOutline });
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
