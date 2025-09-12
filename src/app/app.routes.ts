// File: src/app/app.routes.ts
import { Routes } from '@angular/router';
import { InventoryComponent } from './inventory/inventory.component';

import { AuthCallbackComponent } from './auth/callback/callback.component';

import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { InboxComponent } from './inbox/inbox.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'inbox', component: InboxComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: '', redirectTo: '/inventory', pathMatch: 'full' },
  { path: 'inventory', component: InventoryComponent },
  { path: 'auth/callback', component: AuthCallbackComponent }
];
