// File: src/app/app.routes.ts
import { Routes } from '@angular/router';
import { InventoryComponent } from './inventory/inventory.component';

import { AuthCallbackComponent } from './auth/callback/callback.component';

import { InboxComponent } from './inbox/inbox.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HomeComponent } from './home/home.component'; // Importer le nouveau composant
import { authGuard } from './auth.guard'; // Importer le guard

export const routes: Routes = [
  { path: '', component: HomeComponent }, // Page par défaut
  {
    path: 'inventory',
    component: InventoryComponent,
    canActivate: [authGuard] // Protéger la route
  },
  {
    path: 'inbox',
    component: InboxComponent,
    canActivate: [authGuard] // Protéger la route
  },
  {
    path: 'planning/summary',
    component: DashboardComponent,
    canActivate: [authGuard] // Protéger la route
  },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' } // Redirection pour les routes inconnues
];
