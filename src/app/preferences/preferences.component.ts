import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './preferences.component.html',
})
export class PreferencesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  authService = inject(AuthService);

  preferencesForm: FormGroup = this.fb.group({
    totalBudget: [0],
    monthlyBudget: [0]
  });

  saveStatus = '';

  ngOnInit(): void {
    this.apiService.getUserProfile().subscribe(profile => {
      this.preferencesForm.patchValue({
        totalBudget: profile.total_budget,
        monthlyBudget: profile.monthly_budget
      });
    });
  }

  savePreferences(): void {
    if (this.preferencesForm.valid) {
      this.saveStatus = 'Sauvegarde...';
      this.apiService.updateUserBudgets(this.preferencesForm.value).subscribe({
        next: () => {
          this.saveStatus = 'Préférences sauvegardées !';
          setTimeout(() => this.saveStatus = '', 2000);
        },
        error: () => this.saveStatus = 'Erreur lors de la sauvegarde.'
      });
    }
  }
}
