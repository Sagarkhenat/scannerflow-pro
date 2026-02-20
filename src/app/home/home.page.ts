import { Component, inject } from '@angular/core';
import { Platform,IonContent,IonProgressBar,IonCard,
        IonCardContent, IonList,IonFab, IonFabButton,
        IonIcon,IonText, IonGrid, IonRow,IonCol,
        IonHeader,AlertController,IonButton,IonSpinner,
        IonSearchbar,IonItem,IonThumbnail,IonSkeletonText, IonLabel } from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { scanOutline,trashOutline,chevronDownCircleOutline,downloadOutline } from 'ionicons/icons';
import { CommonModule,PercentPipe,DatePipe } from '@angular/common';
import { IonRefresher, IonRefresherContent, ToastController } from '@ionic/angular/standalone';
import { Haptics, ImpactStyle,NotificationType } from '@capacitor/haptics';


import { ScanItemComponent } from '../component/scan-item/scan-item.component';
import { EmptyStateComponent } from '../component/empty-state/empty-state.component';
import { BarcodeService,ScanStateService,SyncService } from 'src/providers/providers';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonLabel, IonSearchbar, CommonModule, ScanItemComponent, PercentPipe,DatePipe,
            IonContent,IonProgressBar,IonCard,IonCardContent,
            IonList,IonFab, IonFabButton, IonIcon,
            IonText, IonGrid, IonRow, IonCol,IonHeader,IonButton,
            IonRefresher, IonRefresherContent,IonSpinner,EmptyStateComponent,
            IonItem,IonThumbnail,IonSkeletonText]
})
export class HomePage {

  // Property to check if we are on a native device
  isNative = this.platform.is('hybrid');

  constructor(public scanState:ScanStateService,public syncService: SyncService,  private barcodeService: BarcodeService,
            private platform: Platform,  private alertCtrl: AlertController,private toastCtrl : ToastController) {

    // Registering the icon so it renders in standalone mode
    addIcons({ scanOutline, trashOutline, chevronDownCircleOutline, downloadOutline });

  }

  /**
   *
  */
  async ngOnInit() {
    // 1. Show the skeleton screen
    this.scanState.isLoading.set(true);

    try {
      // 2. Load your data (e.g., from Storage or API)
      await this.scanState.loadInitialData();
    } finally {
      // 3. Hide the skeleton (the UI will automatically switch to Data or Empty)
      this.scanState.isLoading.set(false);
    }
  }

  /**
   *
  */
  public mockScanSuccess = (code: string) => {
    console.log('Simulating scan for browser testing...', code);
    this.scanState.addScan(code);
    // This will trigger the SyncService automatically
  }

  /**
   *
  */
  public mockScanError = (code: string) => {
    console.log('Simulating scan for browser testing...', code);
    this.scanState.addScan(code);
    // This will trigger the SyncService automatically
  }

  /**
   *
  */
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

  /**
   *
  */
  public retrySync = (item: any) => {
    this.scanState.updateStatus(item.barcode, 'pending');
    // Trigger the queue processing manually
    this.syncService.processQueue();
  }

  /**
   *
  */
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

  /**
   *
  */
  public async handleRefresh(event: any) {

    //Trigger haptic feedback for a tactile feel
    if (this.isNative) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }else{

    }
    console.log('Manual refresh triggered to update the scanned items :::');

    // Start loading state
    this.scanState.isLoading.set(true);

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

    // Turn off loading state and notify the UI component
    this.scanState.isLoading.set(false);
    // Complete the refresh animation
    event.target.complete();
  }

  /**
   *
  */
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

  /**
   *
  */
  public deleteScannedItem = (barcode: string) => {
    // Assuming scanState has a method to remove items
    console.log('barcode string value passed in delete scanned itemm flow :::', barcode);

    this.scanState.removeScan(barcode);

    // Add a light haptic tap to confirm deletion
    if (this.isNative) {
      Haptics.impact({ style: ImpactStyle.Light });
    }else{}

  }

  /**
   * Updates the search term in the service.
   * This triggers the 'computed' signals for filteredScans automatically.
  */
  public onSearchChange = (event: any) => {
    console.log('Inside on search item functionchange :::', event,event.target.value);
    const query = event.target.value || '';

    console.log('The query value generated to be passed for searching barcode item:::', query);

    this.scanState.updateSearch(query);
    this.scanState.searchTerm.set(query); // This triggers the viewStatus computed signal!
  }

  /**
   * Resets the search when the 'X' is clicked or 'Clear' button is pressed
  */
  public onSearchClear = () => {
    this.scanState.updateSearch('');
  }

  /**
   * Handles actions emitted from the EmptyStateComponent
  */
  handleEmptyStateAction() {
    if (this.scanState.searchTerm()) {

      // If they were searching, clear it to show all results
      //this.onSearchClear();
      // Scenario: User searched for something that doesn't exist
      this.scanState.searchTerm.set('');
    } else {
      // If the list was totally empty, trigger the scanner
      // Scenario: App is fresh/empty
      this.startNewScan();
    }
  }

  /**
   *
  */
  public exportData = () => {
      const csvData = this.scanState.generateCSVString(); // Move the string generation to a helper

      if (this.isNative) {
        this.scanState.shareCSV(csvData);
      } else {
        this.scanState.downloadFile(csvData, 'scans.csv');
      }
  }
}
