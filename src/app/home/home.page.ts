import { Component, inject,CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Platform,IonContent,IonProgressBar,IonCard,
        IonCardContent, IonList,IonFab, IonFabButton,
        IonIcon,IonText, IonGrid, IonRow,IonCol,IonHeader,AlertController,IonButton,IonSpinner } from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { scanOutline,trashOutline,chevronDownCircleOutline } from 'ionicons/icons';

import { CommonModule,PercentPipe,DatePipe } from '@angular/common';
import { IonRefresher, IonRefresherContent, ToastController } from '@ionic/angular/standalone';
import { Haptics, ImpactStyle,NotificationType } from '@capacitor/haptics';

import { BarcodeService,ScanStateService,SyncService } from 'src/providers/providers';
import { ScanItemComponent } from '../component/scan-item/scan-item.component';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, ScanItemComponent, PercentPipe,DatePipe,
            IonContent,IonProgressBar,IonCard,IonCardContent,
            IonList,IonFab, IonFabButton, IonIcon,
            IonText, IonGrid, IonRow, IonCol,IonHeader,IonButton,
            IonRefresher, IonRefresherContent,IonSpinner],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePage {

  // Inject the service as public so the template can see it
  public scanState = inject(ScanStateService);
  public  syncService = inject(SyncService);
  private barcodeService = inject(BarcodeService);
  private platform = inject(Platform);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  // Property to check if we are on a native device
  isNative = this.platform.is('hybrid');

  constructor() {
    // Registering the icon so it renders in standalone mode
    addIcons({ scanOutline, trashOutline, chevronDownCircleOutline });
  }

  mockScan(code: string) {
    console.log('Simulating scan for browser testing...', code);
    this.scanState.addScan(code);
    // This will trigger the SyncService automatically
  }

  async startNewScan() {
    try {
      const barcodes = await this.barcodeService.startScan();

      // Iterate through each barcode to check for duplicates individually
      for (const code of barcodes) {
        const wasAdded = this.scanState.addScan(code); //

        if (this.isNative) {
          if (wasAdded) {
            // Success: Light "tap" for a new item
            await Haptics.impact({ style: ImpactStyle.Light });
          } else {
            // Duplicate: Double-pulse "warning" vibration
            await Haptics.notification({ type: NotificationType.Warning });

            // 2. Show the "Duplicate" Toast
            await this.showDuplicateToast(code);
          }
        }else{}

      }// End of for-loop

    } catch (err) {
      console.error('Scanning failed', err);
    }
  }

  retrySync(item: any) {
    this.scanState.updateStatus(item.barcode, 'pending');
    // Trigger the queue processing manually
    this.syncService.processQueue();
  }

  async confirmClear() {
    const alert = await this.alertCtrl.create({
      header: 'Clear History?',
      message: 'This will permanently delete all local scan records.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.scanState.clearHistory();
          }
        }
      ]
    });

    await alert.present();
  }


  async handleRefresh(event: any) {

    //Trigger haptic feedback for a tactile feel
    if (this.isNative) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }else{

    }

    console.log('Manual refresh triggered to update the scanned items :::');

    // Find any items that currently have an 'error' status
    // and move them back to 'pending' so the sync engine picks them up
    this.scanState.scanList().forEach(item => {
      console.log('Individual item found from the scanned list ::::', item);
      if (item.status === 'error') {
        this.scanState.updateStatus(item.barcode, 'pending');
      }else{

      }
    });

    // Explicitly trigger the processing queue
    await this.syncService.processQueue();

    // Complete the refresh animation
    event.target.complete();
  }


  private async showDuplicateToast(barcode: string) {
    const toast = await this.toastCtrl.create({
      message: `Duplicate ignored: ${barcode}`,
      duration: 1500,
      position: 'bottom',
      color: 'warning',
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }
}
