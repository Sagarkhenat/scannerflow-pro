import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonItem, IonLabel, IonBadge, IonButton, IonIcon,
        IonItemSliding,IonItemOptions,IonItemOption,IonThumbnail} from '@ionic/angular/standalone';
import { ScannedItem } from 'src/providers/scan-state-service/scan-state.service';
import { addIcons } from 'ionicons';
import { refreshOutline, trashOutline,barcodeOutline } from 'ionicons/icons';
@Component({
  selector: 'app-scan-item',
  standalone: true,
  imports: [CommonModule,IonItem, IonBadge, IonButton, IonIcon,
            IonItemSliding, IonItemOptions, IonItemOption,IonThumbnail],
  templateUrl: './scan-item.component.html',
  styleUrls: ['./scan-item.component.scss'],
})

export class ScanItemComponent {

  @Input({ required: true }) item!: ScannedItem; // Uses the interface from ScanStateService
  @Output() onRetry = new EventEmitter<ScannedItem>();

  @Output() onDelete = new EventEmitter<{ timestampId: number, slidingEl: IonItemSliding }>(); // Emitting the numeric timestamp

  constructor() {
    addIcons({ refreshOutline,trashOutline,barcodeOutline });
  }

  /**
   *
  */
  public getStatusColor = (status: string) => {
    //console.log('Inside status color function for scanned item::', status);

    switch (status) {
      case 'synced': return 'success';
      case 'error': return 'danger';
      case 'pending': return 'warning';
      default: return 'medium'; // 'pending'
    }
  }

  /**
   *
  */
  // Helper method to emit both pieces of data
  public onDeleteClick(timestampId: number, slidingEl: IonItemSliding) {
    this.onDelete.emit({ timestampId, slidingEl });
  }
}
