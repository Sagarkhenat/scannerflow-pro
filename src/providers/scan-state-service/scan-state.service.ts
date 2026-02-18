import { Injectable, signal, computed, effect } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
export interface ScannedItem {
  barcode: string;
  timestamp: number;
  status: 'pending' | 'synced' | 'error';
  productName?: string; //Optional field added to show the product name
}

@Injectable({ providedIn: 'root' })
export class ScanStateService {
  private readonly STORAGE_KEY = 'scans'
  // The scanList variable provides the required result
  public scanList = signal<ScannedItem[]>([]);

  // Declaring a variable to save the last synced time
  public lastSynced = signal<Date | null>(null);

  public isSyncing = signal<boolean>(false);

  constructor() {
    // [2] Load data on startup
    this.loadPersistedData();

    // [3] Auto-save whenever scanList changes
    effect(() => {
      const currentList = this.scanList();
      this.saveData(currentList);
    });
  }

  private async saveData(items: ScannedItem[]) {
    await Preferences.set({
      key: this.STORAGE_KEY,
      value: JSON.stringify(items),
    });
  }

  private async loadPersistedData() {
    const { value } = await Preferences.get({ key: this.STORAGE_KEY });
    if (value) {
      this.scanList.set(JSON.parse(value));
    }
  }

  // Computed signal for the UI to show total count
  totalCount = computed(() => this.scanList().length);

  syncedCount = computed(() =>
    this.scanList().filter(s => s.status === 'synced').length
  );

  errorCount = computed(() =>
    this.scanList().filter(s => s.status === 'error').length
  );

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

  public addScan = (barcode: string) => {

    const currentItems = this.scanList();
    console.log('current Items variable in add Scan function :::', currentItems);

    // Check if the barcode already exists or scanned in the last 10 seconds
    const isDuplicate = currentItems.some(item =>
      item.barcode === barcode &&
      (Date.now() - item.timestamp) < 10000 // 10-second window
    );

    if (isDuplicate) {
      console.warn(`Duplicate scan detected for ${barcode}. Ignoring.`);
      console.log('Duplicate scan detected for the barcode item :: ', barcode);
    return false; // Return false so the UI can provide feedback if needed
    }else{}

    const newItem: ScannedItem = {
      barcode,
      timestamp: Date.now(),
      status: 'pending'
    };

    this.scanList.update(items => [newItem, ...items]);

    return true;
  }

  public updateStatus = (barcode: string, status: ScannedItem['status'], productName?: string) => {
    this.scanList.update(items =>
      items.map(item =>
        item.barcode === barcode
        ? { ...item, status, productName: productName || item.productName }
        : item
      )
    );
  }

  async clearHistory() {
    // Clear the signal state
    this.scanList.set([]);
    // Remove the key from local persistence
    await Preferences.remove({ key: this.STORAGE_KEY });
  }

  public updateLastSynced = () => {
    this.lastSynced.set(new Date());
  }

  public setSyncing = (val: boolean) => {
    this.isSyncing.set(val);
  }

  public removeScan = (barcode: string) => {
    this.scanList.update(items =>
      items.filter(item => item.barcode !== barcode)
    );
  }
}
