// File: src/app/app.routes.ts
import { Routes } from '@angular/router';
import { InventoryComponent } from './inventory/inventory.component';
import { AuthCallbackComponent } from './auth/callback/callback.component';

export const routes: Routes = [
  { path: '', redirectTo: '/inventory', pathMatch: 'full' },
  { path: 'inventory', component: InventoryComponent },
  { path: 'auth/callback', component: AuthCallbackComponent }
];
