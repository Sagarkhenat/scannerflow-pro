import { Component, inject } from '@angular/core';
import { Platform,IonContent,IonProgressBar,IonCard,
        IonCardContent, IonList,IonFab, IonFabButton,
        IonIcon,IonText, IonGrid, IonRow,IonCol,
        IonHeader,AlertController,IonButton,IonSpinner,
        IonSearchbar,IonItem,IonThumbnail,IonSkeletonText,
        IonLabel, IonItemGroup, IonItemDivider } from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { scanOutline,trashOutline,chevronDownCircleOutline,downloadOutline } from 'ionicons/icons';
import { CommonModule,PercentPipe,DatePipe } from '@angular/common';
import { IonRefresher, IonRefresherContent, ToastController } from '@ionic/angular/standalone';
import { Haptics, ImpactStyle,NotificationType } from '@capacitor/haptics';


import { ScanItemComponent } from '../component/scan-item/scan-item.component';
import { EmptyStateComponent } from '../component/empty-state/empty-state.component';
import { ScannerOverlayComponent } from '../component/scanner-overlay/scanner-overlay.component';
import { BarcodeService,ScanStateService,SyncService } from 'src/providers/providers';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonItemDivider, IonItemGroup, IonLabel, IonSearchbar, CommonModule, ScanItemComponent, PercentPipe,DatePipe,
            IonContent,IonProgressBar,IonCard,IonCardContent,
            IonList,IonFab, IonFabButton, IonIcon,
            IonText, IonGrid, IonRow, IonCol,IonHeader,IonButton,
            IonRefresher, IonRefresherContent,IonSpinner,EmptyStateComponent,
            IonItem,IonThumbnail,IonSkeletonText,ScannerOverlayComponent]
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
    // Show the skeleton screen items
    this.scanState.isLoading.set(true);

    try {
      // Load your data (e.g., from Storage or API)
      await this.scanState.loadInitialData();
    } finally {
      // Hide the skeleton screen items (the UI will automatically switch to Data or Empty)
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
  public async startNewScan() : Promise<void> {
    try {

      // start Batch Scan triggers the listener and native overlay
      // It does not return the barcodes; it processes them in the service.
      await this.barcodeService.startBatchScan();

    } catch (err) {
      console.error('Scanning failed in start new scan code', err);
    }
  }

  /**
   *
  */
  public retrySync = (item: any) => {
    // 1. Immediately update UI to show it is attempting to sync again
    // FIXED: Passing item.timestamp instead of item.barcode
    this.scanState.updateStatus(item.timestamp, 'pending');

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
        // FIXED: Passing item.timestamp instead of item.barcode
        this.scanState.updateStatus(item.timestamp, 'pending');
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
  // public deleteScannedItem = (barcode: string) => {
  //   // Assuming scanState has a method to remove items
  //   console.log('barcode string value passed in delete scanned itemm flow :::', barcode);

  //   this.scanState.removeScan(barcode);

  //   // Add a light haptic tap to confirm deletion
  //   if (this.isNative) {
  //     Haptics.impact({ style: ImpactStyle.Light });
  //   }else{}

  // }

  /**
   * Updates the search term in the service.
   * This triggers the 'computed' signals for filteredScans automatically.
  */
  public onSearchChange = (event: any) => {

    console.log('Inside on search change function call :::', event.target.value);
    const query = event.target.value || '';

    console.log('The query value generated to be passed for searching barcode item:::', query);

    // Directly updating the signal triggers the computed filteredScans
    // and your viewStatus signal automatically.
    // this.scanState.updateSearch(query); //Commented during search-filter implementation

    this.scanState.searchTerm.set(query); // This triggers the viewStatus computed signal!
  }

  /**
   * Resets the search when the 'X' is clicked or 'Clear' button is pressed
  */
  public onSearchClear = () => {

    //this.scanState.updateSearch('');//Commented during search-filter implementation

    this.scanState.searchTerm.set('');
  }

  /**
   * Handles actions emitted from the EmptyStateComponent
  */
  async handleEmptyStateAction() {

    // If they were searching, clear it to show all results
    if (this.scanState.searchTerm()) {

      // Scenario: User searched for something that doesn't exist
      //this.onSearchClear();
      this.scanState.searchTerm.set('');
    } else {

      // If the list was totally empty, trigger the scanner
      // Scenario: App is fresh/empty

      try {

        await this.startNewScan();

        // result is now string[] instead of undefined
        // if (result && result.length > 0) {
        //   await this.scanState.saveScanToDisk(result);
        // }else{}

      }catch(error){
        console.error("Action handler failed in handle empty state action", error);
      }

    }
  }

  /**
   * Handles actions
  */
  public handleDelete = async (eventData: { timestampId: number, slidingEl: any }) => {
    const { timestampId, slidingEl } = eventData;
    //Capture the item before deletion for the Undo recovery
    const currentScans = this.scanState.scanList();
    const itemToDelete = currentScans.find(scan => scan.timestamp === timestampId);

    // Safety check: Exit if the item doesn't exist
    if (!itemToDelete){
      slidingEl.close(); // Safety closure
      return;
    }

    console.log('Deleting specific scan event:', timestampId);

    // Present the Confirmation Alert
    const alert = await this.alertCtrl.create({
        header: 'Confirm Deletion',
        message: `Are you sure you want to remove <strong>${itemToDelete.productName || 'this item'}</strong>?`,
        buttons: [
          {
            text: 'Cancel',
            role: 'cancel',
            // If they cancel, we do nothing and the item stays
            handler: () => {
              // Programmatically close the slider if the user cancels
              slidingEl.close();
            }
          },
          {
            text: 'Delete',
            role: 'destructive',
            handler: async () => {
              // Safely update the signal to remove ONLY the matched timestamp
              // Execute the deletion
              this.scanState.scanList.update(scans =>
                scans.filter(scan => scan.timestamp !== timestampId)
              );

              // Show the Success Toast
              const toast = await this.toastCtrl.create({
                message: `${itemToDelete.productName || 'Item'} deleted successfully.`,
                duration: 2000,
                position: 'bottom',
                color: 'dark'
              });

              await toast.present();
            }
          }
        ]
    });

    await alert.present();

  }

}
