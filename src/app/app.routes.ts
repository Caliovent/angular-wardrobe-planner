import { Routes } from '@angular/router';
import { InventoryComponent } from './inventory/inventory.component';

export const routes: Routes = [
  { path: '', redirectTo: '/inventory', pathMatch: 'full' },
  { path: 'inventory', component: InventoryComponent }
];
