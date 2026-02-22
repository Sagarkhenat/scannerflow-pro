import { Injectable, signal, computed, effect } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Platform } from '@ionic/angular/standalone';


import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

import { AlertController } from '@ionic/angular';

import { FeedbackService } from '../providers';
import { MOCK_INVENTORY } from 'src/app/data/mock-inventory';

export interface ScannedItem {
  barcode: string;
  timestamp: number;
  status: 'pending' | 'synced' | 'error';
  productName?: string; //Optional field added to show the product name
}

@Injectable({ providedIn: 'root' })

export class ScanStateService {

  // 1. Consistent Storage Key
  private readonly STORAGE_KEY = 'scans_history';

  public isLoading = signal<boolean>(false);
  public searchTerm = signal<string>('');

  // The scanList variable provides the required result
  public scanList = signal<ScannedItem[]>([]);

  // Declaring a variable to save the last synced time
  public lastSynced = signal<Date | null>(null);

  public isSyncing = signal<boolean>(false);

  // Variable to save the search term
  searchQuery = signal<string>('');

  // Property to check if we are on a native device
  isNative = this.platform.is('hybrid');

  public isScanning = signal<boolean>(false);
  // Helper to check if scanning is active for UI overlays
  public showOverlay = computed(() => this.isScanning());

constructor(private platform: Platform,private alertCtrl: AlertController,private feedback: FeedbackService) {

    /**
     * Whenever the scanList signal changes, this effect automatically
     * persists the new state to the device storage.
    */
    // Auto-save whenever scanList changes
    effect(() => {
      const currentList = this.scanList();

      // Simplified auto-save: any change to scanList is written to disk
      Preferences.set({
        key: this.STORAGE_KEY, // Use your consistent key here
        value: JSON.stringify(currentList),
      });

    });
  }

  /**
   * Method to handle initial data fetching.
   * Triggered by HomePage to load data with a visual loading state.
  */
  async loadInitialData() {
    // Simulate a network or storage delay to test the skeleton screen

    this.isLoading.set(true); // Ensure skeleton screen shows
    try {

      // Attempt to fetch saved scans from the device
      const { value } = await Preferences.get({ key: this.STORAGE_KEY});

      if (value) {
        const savedScans = JSON.parse(value);
        this.scanList.set(savedScans); // Update your Signal with real data
      }else{}

      console.log('Data successfully hydrated from local storage');

      return true;

    }catch (error) {
      console.error('Persistence Error:', error);
      console.error('Failed to load initial scans', error);
      throw error;
    }finally {
      this.isLoading.set(false);
    }

  }

  /**
   * PERSISTENCE BRIDGE: Saves new scans to disk immediately
  */
  public async saveScanToDisk(newScan: any) {

    // If we receive a raw string from the scanner, convert to ScannedItem
    if (typeof newScan === 'string') {
      this.addScan(newScan);
    }else{

      this.scanList.update(items => [newScan, ...items]);
    }
  }

  // Computed signal for the UI to show total count
  totalCount = computed(() => this.scanList().length);

  /**
   *
  */
  syncedCount = computed(() =>
    this.scanList().filter(s => s.status === 'synced').length
  );

  /**
   *
  */
  errorCount = computed(() =>
    this.scanList().filter(s => s.status === 'error').length
  );

  /**
   *
  */
  pendingCount = computed(() =>
    this.scanList().filter(s => s.status === 'pending').length
  );

  // Computed signal for pending items (for your Sync Engine later)
  pendingScans = computed(() =>
    this.scanList().filter(s => s.status === 'pending')
  );

  // Progress percentage for a visual bar
  syncProgress = computed(() => {
    const total = this.totalCount();
    console.log('total variable output in sync progress function :::', total, this.syncedCount());

    if (total === 0) return 0;
    return ( this.syncedCount() / total );
  });

  /**
   *
  */
  // Filtered scanned list items
  filteredScans = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.scanList();

    return this.scanList().filter(item =>
      item.barcode.toLowerCase().includes(query)
    );
  });

  /**
   *
  */
  // Method to update query from the component
  public updateSearch = (term: string) => {
    this.searchQuery.set(term);
  }

  /**
   *
  */
  // Function addedfor determining the view state
  public viewStatus = computed(() => {
    if (this.isLoading()) {
      return 'loading';
    }

    // Note: use .length on the signal value if scanList is a signal
    if(this.scanList().length === 0 && !this.searchTerm()) {
      return 'empty-fresh';
    }
    if (this.filteredScans().length === 0 && this.searchTerm()){
      return 'empty-search';
    }
    return 'data';
  });

  /**
   * ADD SCAN FUNCTION LOGIC
   * Handles duplicate detection and updates the signal.
  */
  public addScan = async (barcode: string) => {

    const currentItems = this.scanList();

    const now = Date.now();

    console.log('current Items variable in add Scan function :::', currentItems);

    // Check if the barcode already exists or scanned in the last 10 seconds
    const isDuplicate = currentItems.some(item =>
      item.barcode === barcode && (now - item.timestamp) < 10000
    );

    if (isDuplicate) {
      console.warn(`Duplicate scan detected for ${barcode}. Ignoring.`);
      console.log('Duplicate scan detected for the barcode item :: ', barcode);
      // Trigger Warning Haptic (Double Pulse)
      await this.feedback.duplicate();
      return false; // Return false so the UI can provide feedback if needed
    }else{

    }

    //Get the product name
    const product = this.lookupProduct(barcode);

    const newItem: ScannedItem = {
      barcode,
      timestamp: Date.now(),
      status: 'pending',
      productName: product.name,
    };

    // Trigger Success Haptic (Single Pulse)
    await this.feedback.success();
    this.scanList.update(items => [newItem, ...items]);

    return true;
  }

  /**
   * Updates scan status and adds metadata
   *
  */
  public updateStatus = (barcode: string, status: ScannedItem['status'], productName?: string) => {
    this.scanList.update(items =>
      items.map(item =>
        item.barcode === barcode
        ? { ...item,
            status,
            // If a name is provided, use it; otherwise, keep existing or leave undefined
            productName: productName || item.productName }
        : item
      )
    );
  }

  /**
 * Maps a raw barcode string to a product name.
 * In a real-world app, this would query a local SQLite DB or an API.
 */
  lookupProduct(barcode: string): { name: string; category?: string } {

    console.log('barcode value passed in lookupProduct function :::', barcode);

    // Mock Data Dictionary
    const product = MOCK_INVENTORY.find(item => item.id === barcode);

    // If found, return the product info; otherwise return a generic label
    if (product) {
      return { name: product.name };
    }

    // Fallback if the item isn't in your inventory list
    return { name: `Unknown Item (${barcode})` };
  }

  /**
   *
  */
  async clearHistory() {
    // Clear the signal state
    this.scanList.set([]);
    // Remove the key from local persistence
    await Preferences.remove({ key: this.STORAGE_KEY });
  }

  /**
   *
  */
  public updateLastSynced = () => {
    this.lastSynced.set(new Date());
  }

  /**
   *
  */
  public setSyncing = (val: boolean) => {
    this.isSyncing.set(val);
  }

  /**
   *
  */
  public removeScan = (barcode: string) => {
    this.scanList.update(items =>
      items.filter(item => item.barcode !== barcode)
    );
  }

  /**
   *
  */
  public generateCSVString = () =>  {
    const data = this.filteredScans();
    if (data.length === 0) return '';

    const headers = ['Barcode', 'Status', 'Timestamp'];
    const rows = data.map(item => [
      item.barcode,
      item.status,
      new Date(item.timestamp).toLocaleString()
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  /**
   *
  */
  //Function to export scanned item info to csv
  async exportFilteredToCSV() {

    const csvContent = this.generateCSVString();

    if (!csvContent) return;

    if (this.isNative) {

      // Mobile Flow: Save to disk then Share
      await this.shareCSV(csvContent);

    } else {
      // Web Flow: Direct Download

      // Tag the filename so the user knows it was a filtered export
      const query = this.searchQuery() ? `-${this.searchQuery()}` : '';

      this.downloadFile(csvContent, `scanflow-export-${Date.now()}.csv`);
    }

  }

  /**
   *
  */
  public downloadFile = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   *
  */
  async shareCSV(csvContent: string) {
    const fileName = `ScanFlow_Export_${Date.now()}.csv`;

    try {
      // Save the file to the device cache first
      const result = await Filesystem.writeFile({
        path: fileName,
        data: csvContent,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      //Open the Native Share Sheet
      await Share.share({
        title: 'Export Scan Data',
        text: 'Sharing my scanned barcodes from ScanFlow Pro',
        url: result.uri,
        dialogTitle: 'Share CSV',
      });
    } catch (error:any) {

      // Show a user-friendly alert if sharing fails
      console.error('Error sharing CSV:', error);
      const alert = await this.alertCtrl.create({
        header: 'Export Failed',
        message: error.message || 'Could not open the share sheet.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }


}
