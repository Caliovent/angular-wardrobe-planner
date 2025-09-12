import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, WritableSignal } from '@angular/core';
import { ApiService } from '../api.service';
import { WardrobeItem } from '../models';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './inbox.component.html',
  styleUrl: './inbox.component.css'
})
export class InboxComponent implements OnInit {
  apiService = inject(ApiService);
  items: WritableSignal<WardrobeItem[]> = signal([]);

  ngOnInit(): void {
    this.loadInboxItems();
  }

  loadInboxItems(): void {
    this.apiService.getItems('inbox').subscribe(items => {
      this.items.set(items);
    });
  }

  planItem(item: WardrobeItem): void {
    const { id, ...itemData } = item;
    // We need to make sure we are sending all the required fields
    const plannedItem: Partial<WardrobeItem> = {
        ...itemData,
        status: 'planned',
        // make sure all non-nullable fields are present
        name: item.name || '',
        category: item.category || 'Vêtement',
        estimatedCost: item.estimatedCost || 0,
        priority: item.priority || 'Moyenne',
        purchaseMonth: item.purchaseMonth || new Date().toISOString().slice(0, 7),
    };

    this.apiService.updateItem(id, plannedItem).subscribe(() => {
      this.items.update(items => items.filter(i => i.id !== id));
    });
  }
}
