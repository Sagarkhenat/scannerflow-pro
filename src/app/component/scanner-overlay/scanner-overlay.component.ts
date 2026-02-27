import { Component} from '@angular/core';
import { IonButton, IonIcon,} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { barcodeOutline,flashlight,flashlightOutline,flash, flashOff, checkmarkCircle} from 'ionicons/icons';

import { BarcodeService,ScanStateService } from 'src/providers/providers';

@Component({
  selector: 'app-scanner-overlay',
  standalone: true,
  imports: [IonIcon,IonButton],
  templateUrl: './scanner-overlay.component.html',
  styleUrls: ['./scanner-overlay.component.scss'],
})

export class ScannerOverlayComponent {
  constructor(public scanState:ScanStateService,public barCode: BarcodeService){

    addIcons({barcodeOutline,flashlight,flashlightOutline,flash, flashOff,checkmarkCircle  });

  }
}
