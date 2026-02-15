import { Injectable, signal, computed } from '@angular/core';

export interface ScannedItem {
  barcode: string;
  timestamp: number;
  status: 'pending' | 'synced' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ScanStateService {
  // The "Source of Truth"
  public scanList = signal<ScannedItem[]>([]);

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
    if (total === 0) return 0;
    return this.syncedCount() / total;
  });

  addScan(barcode: string) {
    const newItem: ScannedItem = {
      barcode,
      timestamp: Date.now(),
      status: 'pending'
    };
    this.scanList.update(items => [newItem, ...items]);
  }

  updateStatus(barcode: string, status: 'synced' | 'error' | 'pending') {
    this.scanList.update(items =>
      items.map(item => item.barcode === barcode ? { ...item, status } : item)
    );
  }
}
