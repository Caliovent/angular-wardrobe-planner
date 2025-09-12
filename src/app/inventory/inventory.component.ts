import { Component, ChangeDetectionStrategy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WardrobeItem, ItemLink } from '../models';
import { ApiService } from '../api.service';
import { debounceTime, switchMap, tap } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryComponent {
  private apiService = inject(ApiService);

  // -- State Management with Signals --
  totalBudget = signal<number>(1000); // Default value, will be loaded
  monthlyBudget = signal<number>(500); // Default value, will be loaded
  items = signal<WardrobeItem[]>([]);
  expandedItemId = signal<number | null>(null);

  categoryFilter = signal<'Tous' | 'Vêtement' | 'Chaussures' | 'Parfum'>('Tous');
  priorityFilter = signal<'Tous' | 'Haute' | 'Moyenne' | 'Basse'>('Tous');
  sortOption = signal<'month' | 'cost_desc' | 'cost_asc'>('month');

  // Subjects for debouncing updates
  private costUpdate$ = new Subject<{ id: number; cost: number | undefined }>();
  private notesUpdate$ = new Subject<{ id: number; notes: string }>();
  private ratingUpdate$ = new Subject<{ id: number; rating: number }>();

  private backendUrl = 'https://angular-wardrobe-planner.onrender.com'; // Ceci devrait être une variable d'environnement

  // -- Computed Signals for derived data --
  totalPlannedCost = computed(() => this.items().reduce((sum, item) => sum + item.estimatedCost, 0));
  totalSpent = computed(() => this.items().filter(i => i.isPurchased).reduce((sum, item) => sum + (item.actualCost ?? item.estimatedCost), 0));
  totalSavings = computed(() => this.items().filter(i => i.isPurchased && i.actualCost != null).reduce((sum, item) => sum + (item.estimatedCost - item.actualCost!), 0));
  remainingBudget = computed(() => this.totalBudget() - this.totalSpent());

  filteredAndSortedItems = computed(() => {
    let filtered = this.items();

    if(this.categoryFilter() !== 'Tous') {
        filtered = filtered.filter(item => item.category === this.categoryFilter());
    }
    if(this.priorityFilter() !== 'Tous') {
        filtered = filtered.filter(item => item.priority === this.priorityFilter());
    }

    const sorted = [...filtered];
    switch (this.sortOption()) {
        case 'month': return sorted.sort((a, b) => a.purchaseMonth.localeCompare(b.purchaseMonth));
        case 'cost_desc': return sorted.sort((a, b) => b.estimatedCost - a.estimatedCost);
        case 'cost_asc': return sorted.sort((a, b) => a.estimatedCost - b.estimatedCost);
        default: return sorted;
    }
  });

  monthlyBreakdown = computed(() => {
    const monthlyData: { [key: string]: { month: string, plannedCost: number, spentCost: number } } = {};

    this.items().forEach(item => {
      const month = item.purchaseMonth;
      if (!monthlyData[month]) {
        monthlyData[month] = { month, plannedCost: 0, spentCost: 0 };
      }
      monthlyData[month].plannedCost += item.estimatedCost;
      if (item.isPurchased) {
        monthlyData[month].spentCost += item.actualCost ?? item.estimatedCost;
      }
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  });

  defaultMonth = new Date().toISOString().slice(0, 7);

  constructor() {
    this.loadInitialData();
    this.setupDebouncedUpdates();
  }

  private loadInitialData() {
    this.apiService.getItems().subscribe(items => {
      this.items.set(items);
    });
    // In a real app, budget would also be fetched from the backend, likely associated with a user
  }

  private setupDebouncedUpdates() {
    this.costUpdate$.pipe(
      debounceTime(500),
      switchMap(({ id, cost }) => this.apiService.updateItem(id, { actualCost: cost }))
    ).subscribe();

    this.notesUpdate$.pipe(
      debounceTime(500),
      switchMap(({ id, notes }) => this.apiService.updateItem(id, { notes: notes }))
    ).subscribe();

    this.ratingUpdate$.pipe(
      debounceTime(300),
      switchMap(({ id, rating }) => this.apiService.updateItem(id, { rating: rating }))
    ).subscribe();
  }

  // -- Methods for interactions --
  updateTotalBudget(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.totalBudget.set(Number(value) || 0);
  }

  updateMonthlyBudget(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.monthlyBudget.set(Number(value) || 0);
  }

  addItem(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const newItem = {
      name: formData.get('name') as string,
      category: formData.get('category') as 'Vêtement' | 'Chaussures' | 'Parfum',
      status: 'planned' as const,
      estimatedCost: Number(formData.get('estimatedCost')),
      priority: formData.get('priority') as 'Haute' | 'Moyenne' | 'Basse',
      purchaseMonth: formData.get('purchaseMonth') as string,
    };

    this.apiService.createItem(newItem).subscribe(createdItem => {
        this.items.update(currentItems => [...currentItems, createdItem]);
        form.reset();
        (form.elements.namedItem('purchaseMonth') as HTMLInputElement).value = this.defaultMonth;
    });
  }

  removeItem(id: number) {
    this.apiService.deleteItem(id).subscribe(() => {
        this.items.update(items => items.filter(item => item.id !== id));
    });
  }

  togglePurchased(id: number) {
    const item = this.items().find(i => i.id === id);
    if (!item) return;

    const isNowPurchased = !item.isPurchased;
    this.apiService.updateItem(id, { isPurchased: isNowPurchased }).subscribe(() => {
        this.items.update(items =>
            items.map(i => i.id === id ? { ...i, isPurchased: isNowPurchased } : i)
        );
    });
  }

  updateActualCost(id: number, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const cost = value === '' ? undefined : Number(value);

    // Update local signal immediately for responsiveness
    this.items.update(items => items.map(item => item.id === id ? { ...item, actualCost: cost } : item));
    // Debounce the API call
    this.costUpdate$.next({ id, cost });
  }

  toggleDetails(id: number) {
    this.expandedItemId.update(currentId => currentId === id ? null : id);
  }

  updateRating(id: number, rating: number) {
    this.items.update(items => items.map(item => item.id === id ? { ...item, rating } : item));
    this.ratingUpdate$.next({ id, rating });
  }

  updateNotes(id: number, event: Event) {
    const notes = (event.target as HTMLTextAreaElement).value;
    this.items.update(items => items.map(item => item.id === id ? { ...item, notes } : item));
    this.notesUpdate$.next({ id, notes });
  }

  addImageUrl(id: number, event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const imageUrl = formData.get('imageUrl') as string;
    if (!imageUrl) return;

    this.apiService.addImageUrl(id, imageUrl).subscribe(() => {
        this.items.update(items => items.map(item => {
            if (item.id === id) {
                const updatedImages = [...(item.imageUrls || []), imageUrl];
                return { ...item, imageUrls: updatedImages };
            }
            return item;
        }));
        form.reset();
    });
  }

  removeImageUrl(id: number, urlToRemove: string) {
    this.apiService.removeImageUrl(id, urlToRemove).subscribe(() => {
        this.items.update(items => items.map(item => {
            if (item.id === id) {
                const updatedImages = (item.imageUrls || []).filter(url => url !== urlToRemove);
                return { ...item, imageUrls: updatedImages };
            }
            return item;
        }));
    });
  }

  addLink(id: number, event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const url = formData.get('url') as string;
    const annotation = formData.get('annotation') as string;
    if (!url || !annotation) return;

    this.apiService.addLink(id, { url, annotation }).subscribe(newLink => {
        this.items.update(items => items.map(item => {
            if (item.id === id) {
                const updatedLinks = [...(item.links || []), newLink];
                return { ...item, links: updatedLinks };
            }
            return item;
        }));
        form.reset();
    });
  }

  removeLink(id: number, linkIdToRemove: number) {
     this.apiService.removeLink(id, linkIdToRemove).subscribe(() => {
        this.items.update(items => items.map(item => {
            if (item.id === id) {
                const updatedLinks = (item.links || []).filter(link => link.id !== linkIdToRemove);
                return { ...item, links: updatedLinks };
            }
            return item;
        }));
     });
  }

  filterByCategory(event: Event) {
    const value = (event.target as HTMLSelectElement).value as 'Tous' | 'Vêtement' | 'Chaussures' | 'Parfum';
    this.categoryFilter.set(value);
  }

  filterByPriority(event: Event) {
      const value = (event.target as HTMLSelectElement).value as 'Tous' | 'Haute' | 'Moyenne' | 'Basse';
      this.priorityFilter.set(value);
  }

  sortBy(event: Event) {
      const value = (event.target as HTMLSelectElement).value as 'month' | 'cost_desc' | 'cost_asc';
      this.sortOption.set(value);
  }

  // -- Helper Methods --
  getMonthYear(dateString: string): string {
    if (!dateString) return '';
    const [year, month] = dateString.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }
}
