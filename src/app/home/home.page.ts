import { Component, inject } from '@angular/core';
import { Platform,IonContent,IonProgressBar,IonCard,
        IonCardContent, IonList,IonFab, IonFabButton,
        IonIcon,IonText, IonGrid, IonRow,IonCol,
        IonHeader,AlertController,IonButton,IonSpinner } from '@ionic/angular/standalone';

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
            IonRefresher, IonRefresherContent,IonSpinner]
})
export class HomePage {

  // Inject the service as public so the template can see it
  // public scanState = inject(ScanStateService);
  // public  syncService = inject(SyncService);
  // private barcodeService = inject(BarcodeService);
  // private platform = inject(Platform);
  // private alertCtrl = inject(AlertController);
  // private toastCtrl = inject(ToastController);

  // Property to check if we are on a native device
  isNative = this.platform.is('hybrid');

  constructor(public scanState:ScanStateService,public syncService: SyncService,  private barcodeService: BarcodeService,
            private platform: Platform,  private alertCtrl: AlertController,private toastCtrl : ToastController) {

    // Registering the icon so it renders in standalone mode
    addIcons({ scanOutline, trashOutline, chevronDownCircleOutline });

  }

  public mockScanSuccess = (code: string) => {
    console.log('Simulating scan for browser testing...', code);
    this.scanState.addScan(code);
    // This will trigger the SyncService automatically
  }

  public mockScanError = (code: string) => {
    console.log('Simulating scan for browser testing...', code);
    this.scanState.addScan(code);
    // This will trigger the SyncService automatically
  }

  public async startNewScan() {
    try {
      const barcodes = await this.barcodeService.startScan();

      // Iterate through each barcode to check for duplicates individually
      for (const code of barcodes) {
        const wasAdded = this.scanState.addScan(code); //

        // Check for running on android/iOS device
        if (this.isNative) {
          if (wasAdded) {
            // Success: Add a "Light" impact for a clean confirmation
            await Haptics.impact({ style: ImpactStyle.Light });
          } else {
            // Duplicate: Double-pulse "warning" vibration
            await Haptics.notification({ type: NotificationType.Warning });

            // Show the "Duplicate" Toast
            await this.showDuplicateToast(code);
          }
        }else{}

      }// End of for-loop

    } catch (err) {
      console.error('Scanning failed', err);
    }
  }

  public retrySync = (item: any) => {
    this.scanState.updateStatus(item.barcode, 'pending');
    // Trigger the queue processing manually
    this.syncService.processQueue();
  }

  public async confirmClear () {
    const alert = await this.alertCtrl.create({
      header: 'Clear Item History?',
      message: 'This will permanently delete all local scanned records.',
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


  public async handleRefresh(event: any) {

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


  private async showDuplicateToast (barcode: string) {
    const toast = await this.toastCtrl.create({
      message: `Duplicate ignored: ${barcode}`,
      duration: 1500,
      position: 'bottom',
      color: 'warning',
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await toast.present();
  }

  public deleteScannedItem = (barcode: string) => {
    // Assuming scanState has a method to remove items
    console.log('barcode string value passed in delete scanned itemm flow :::', barcode);

    this.scanState.removeScan(barcode);

    // Add a light haptic tap to confirm deletion
    if (this.isNative) {
      Haptics.impact({ style: ImpactStyle.Light });
    }else{}

  }
}
