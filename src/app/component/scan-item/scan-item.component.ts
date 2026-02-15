// src/app/components/scan-item/scan-item.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ScannedItem } from 'src/providers/scan-state-service/scan-state.service';

@Component({
  selector: 'app-scan-item',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-item>
      <ion-label>
        <h2>{{ item.barcode }}</h2>
        <p>{{ item.timestamp | date:'mediumTime' }}</p>
      </ion-label>

      <ion-badge slot="end" [color]="getStatusColor(item.status)">
        {{ item.status | uppercase }}
      </ion-badge>

      <ion-button
        *ngIf="item.status === 'error'"
        slot="end"
        fill="clear"
        (click)="onRetry.emit(item)">
        <ion-icon name="refresh-outline"></ion-icon>
      </ion-button>
    </ion-item>
  `
})
export class ScanItemComponent {
  @Input({ required: true }) item!: ScannedItem;
  @Output() onRetry = new EventEmitter<ScannedItem>();

  getStatusColor(status: string) {
    switch (status) {
      case 'synced': return 'success';
      case 'error': return 'danger';
      default: return 'warning'; // 'pending'
    }
  }
}
