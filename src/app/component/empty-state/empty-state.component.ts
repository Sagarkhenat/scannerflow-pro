import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { IonIcon,IonButton } from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { barcodeOutline,cloudOfflineOutline,scanOutline } from 'ionicons/icons';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  standalone: true,
  imports: [IonIcon,IonButton]
})
export class EmptyStateComponent {
  @Input() mode: 'initial' | 'search' | 'error' = 'initial';
  @Input() searchTerm: string = '';

  // Create the emitter
  @Output() onAction = new EventEmitter<void>();

  constructor(){
    // Registering the icon so it renders in standalone mode
    addIcons({ barcodeOutline,cloudOfflineOutline,scanOutline  });
  }
  // Dynamic content based on the current app state
  public content = computed(() => {
    switch (this.mode) {
      case 'search':
        return {
          title: 'No Barcodes Matched',
          description: `No results found for '${this.searchTerm}'. Try a different ID.`,
          icon: 'barcode-outline',
          buttonText: 'Clear Search'
        };
      case 'error':
        return {
          title: 'Sync Interrupted',
          description: `We couldn't reach the database. Please check your connection.`,
          icon: 'cloud-offline-outline',
          buttonText: 'Retry Sync'
        };
      default:
        return {
          title: 'Ready to Scan?',
          description: 'Scan a barcode to begin tracking your inventory.',
          icon: 'scan-outline',
          buttonText: 'Start First Scan'
        };
    }
  });

  // Method called by the HTML button
  handleButtonClick() {
    this.onAction.emit();
  }

}
