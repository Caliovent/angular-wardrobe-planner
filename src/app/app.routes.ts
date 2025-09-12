// File: src/app/app.routes.ts
import { Routes } from '@angular/router';
import { InventoryComponent } from './inventory/inventory.component';
import { AuthCallbackComponent } from './auth/callback/callback.component';
import { PreferencesComponent } from './preferences/preferences.component';
import { InboxComponent } from './inbox/inbox.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HomeComponent } from './home/home.component';
import { authGuard } from './auth.guard';
import { TabsComponent } from './tabs/tabs.component';

export const routes: Routes = [
  { path: '', component: HomeComponent }, // Page par défaut (login)
  { path: 'auth/callback', component: AuthCallbackComponent },
  {
    path: 'tabs',
    component: TabsComponent,
    canActivate: [authGuard], // Protéger la route
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
      },
      {
        path: 'inventory',
        component: InventoryComponent,
      },
      {
        path: 'inbox',
        component: InboxComponent,
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'preferences',
    component: PreferencesComponent,
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }, // Redirection pour les routes inconnues
];
