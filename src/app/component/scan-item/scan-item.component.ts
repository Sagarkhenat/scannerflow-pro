import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { IonItem, IonLabel, IonBadge, IonButton, IonIcon } from '@ionic/angular/standalone';
import { ScannedItem } from 'src/providers/scan-state-service/scan-state.service';
import { addIcons } from 'ionicons';
import { refreshOutline } from 'ionicons/icons';
@Component({
  selector: 'app-scan-item',
  standalone: true,
  imports: [CommonModule, IonicModule,IonItem, IonBadge, IonButton, IonIcon],
  templateUrl: './scan-item.component.html',
  styleUrls: ['./scan-item.component.scss'],
})

export class ScanItemComponent {
  @Input({ required: true }) item!: ScannedItem;
  @Output() onRetry = new EventEmitter<ScannedItem>();

  constructor() {
    addIcons({ refreshOutline });
  }

  getStatusColor(status: string) {
    console.log('Inside status color function for scanned item::', status);
    switch (status) {
      case 'synced': return 'success';
      case 'error': return 'danger';
      case 'pending': return 'warning';
      default: return 'medium'; // 'pending'
    }
  }
}
