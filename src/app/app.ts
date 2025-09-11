import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

// -- Modèles de Données (Interfaces) --
// Représente un lien avec une annotation
interface ItemLink {
  id: number;
  url: string;
  annotation: string;
}

// Représente un article à acheter
interface WardrobeItem {
  id: number;
  name: string;
  category: 'Vêtement' | 'Chaussures' | 'Parfum';
  estimatedCost: number;
  actualCost?: number;
  priority: 'Haute' | 'Moyenne' | 'Basse';
  purchaseMonth: string; // Format YYYY-MM
  isPurchased: boolean;
  purchaseDate?: Date;
  // Nouveaux champs pour le suivi détaillé
  notes?: string;
  rating?: number; // de 1 à 5
  imageUrls?: string[];
  links?: ItemLink[];
}

// -- Composant Principal de l'Application --
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-gray-100 min-h-screen font-sans text-gray-800">
      <header class="bg-white shadow-md">
        <div class="container mx-auto px-6 py-4">
          <h1 class="text-3xl font-bold text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 inline-block mr-2 -mt-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            Planificateur de Garde-Robe
          </h1>
          <p class="text-gray-600 mt-1">Organisez et budgétez le renouvellement de votre style.</p>
        </div>
      </header>

      <main class="container mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Colonne de gauche : Ajout et Budget -->
        <div class="lg:col-span-1 space-y-8">
          <!-- Section Budget -->
          <div class="bg-white p-6 rounded-lg shadow-lg">
            <h2 class="text-xl font-bold mb-4">Synthèse Budgétaire</h2>
            <div class="space-y-4">
              <div class="flex items-center space-x-3">
                <label for="totalBudget" class="font-semibold whitespace-nowrap">Budget Total :</label>
                <input
                  type="number"
                  id="totalBudget"
                  [value]="totalBudget()"
                  (input)="updateTotalBudget($event)"
                  class="input-style w-full"
                />
                <span>€</span>
              </div>
               <div class="flex items-center space-x-3">
                <label for="monthlyBudget" class="font-semibold whitespace-nowrap">Budget Mensuel :</label>
                <input
                  type="number"
                  id="monthlyBudget"
                  [value]="monthlyBudget()"
                  (input)="updateMonthlyBudget($event)"
                  class="input-style w-full"
                />
                <span>€</span>
              </div>
            </div>
            <div class="space-y-3 mt-6 border-t pt-4">
              <div class="flex justify-between items-center p-3 bg-blue-100 rounded-md">
                <span class="font-semibold">Coût Planifié:</span>
                <span class="font-bold text-blue-800">{{ totalPlannedCost() | number:'1.2-2' }} €</span>
              </div>
              <div class="flex justify-between items-center p-3 bg-green-100 rounded-md">
                <span class="font-semibold">Dépensé:</span>
                <span class="font-bold text-green-800">{{ totalSpent() | number:'1.2-2' }} €</span>
              </div>
              <div class="flex justify-between items-center p-3 bg-teal-100 rounded-md">
                <span class="font-semibold">Économisé:</span>
                <span class="font-bold text-teal-800">{{ totalSavings() | number:'1.2-2' }} €</span>
              </div>
              <div class="flex justify-between items-center p-3 rounded-md" [ngClass]="remainingBudget() >= 0 ? 'bg-yellow-100' : 'bg-red-200'">
                <span class="font-semibold">Budget Restant:</span>
                <span class="font-bold" [ngClass]="remainingBudget() >= 0 ? 'text-yellow-800' : 'text-red-800'">
                  {{ remainingBudget() | number:'1.2-2' }} €
                </span>
              </div>
            </div>
          </div>

          <!-- Section Ajout d'article -->
          <div class="bg-white p-6 rounded-lg shadow-lg">
            <h2 class="text-xl font-bold mb-4">Ajouter un Article</h2>
            <form (submit)="addItem($event)" class="space-y-4">
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700">Nom de l'article</label>
                <input required type="text" name="name" id="name" class="input-style" placeholder="Ex: Manteau d'hiver">
              </div>
              <div>
                <label for="category" class="block text-sm font-medium text-gray-700">Catégorie</label>
                <select required name="category" id="category" class="input-style">
                  <option>Vêtement</option>
                  <option>Chaussures</option>
                  <option>Parfum</option>
                </select>
              </div>
              <div>
                <label for="estimatedCost" class="block text-sm font-medium text-gray-700">Coût estimé (€)</label>
                <input required type="number" name="estimatedCost" id="estimatedCost" class="input-style" placeholder="150">
              </div>
              <div>
                <label for="priority" class="block text-sm font-medium text-gray-700">Priorité</label>
                <select required name="priority" id="priority" class="input-style">
                  <option>Haute</option>
                  <option>Moyenne</option>
                  <option>Basse</option>
                </select>
              </div>
              <div>
                <label for="purchaseMonth" class="block text-sm font-medium text-gray-700">Mois d'achat prévu</label>
                <input required type="month" name="purchaseMonth" id="purchaseMonth" class="input-style" [value]="defaultMonth">
              </div>
              <button type="submit" class="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300">
                Ajouter au Plan
              </button>
            </form>
          </div>

           <!-- Section Budget Mensuel -->
          <div class="bg-white p-6 rounded-lg shadow-lg">
            <h2 class="text-xl font-bold mb-4">Détail par Mois</h2>
            <div class="space-y-3 max-h-60 overflow-y-auto">
              @for(month of monthlyBreakdown(); track month.month) {
                <div class="p-3 rounded-lg border border-gray-200">
                  <p class="font-bold">{{ getMonthYear(month.month) }}</p>
                  <div class="text-sm space-y-1 mt-1">
                    <div class="flex justify-between"><span>Planifié:</span> <span>{{ month.plannedCost | number:'1.2-2' }} €</span></div>
                    <div class="flex justify-between"><span>Dépensé:</span> <span class="font-semibold">{{ month.spentCost | number:'1.2-2' }} €</span></div>
                    <div class="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div class="bg-blue-600 h-2.5 rounded-full" [style.width.%]="(monthlyBudget() > 0 ? (month.spentCost / monthlyBudget()) * 100 : 0)"></div>
                    </div>
                  </div>
                </div>
              } @empty {
                 <p class="text-gray-500 text-sm">Aucune dépense planifiée.</p>
              }
            </div>
          </div>
        </div>

        <!-- Colonne de droite : Liste des articles planifiés -->
        <div class="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg">
          <h2 class="text-xl font-bold mb-4">Mon Plan d'Achat</h2>
          <!-- Filtres -->
          <div class="flex flex-wrap gap-4 mb-6 pb-4 border-b">
             <select (change)="filterByCategory($event)" class="filter-style">
                <option value="Tous">Toutes catégories</option>
                <option>Vêtement</option>
                <option>Chaussures</option>
                <option>Parfum</option>
            </select>
            <select (change)="filterByPriority($event)" class="filter-style">
                <option value="Tous">Toutes priorités</option>
                <option>Haute</option>
                <option>Moyenne</option>
                <option>Basse</option>
            </select>
            <select (change)="sortBy($event)" class="filter-style">
                <option value="month">Trier par Mois</option>
                <option value="cost_desc">Trier par Coût (Décroissant)</option>
                <option value="cost_asc">Trier par Coût (Croissant)</option>
            </select>
          </div>

          <!-- Liste des articles -->
          <div class="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
             @for (item of filteredAndSortedItems(); track item.id) {
              <div class="p-4 rounded-lg border transition-all duration-300"
                [ngClass]="{
                  'bg-green-50 border-green-200': item.isPurchased,
                  'bg-white hover:shadow-md': !item.isPurchased,
                  'border-red-300': item.priority === 'Haute' && !item.isPurchased,
                  'border-yellow-300': item.priority === 'Moyenne' && !item.isPurchased,
                  'border-gray-200': item.priority === 'Basse' && !item.isPurchased
                }">
                <!-- Header de l'article -->
                <div class="flex items-start justify-between">
                  <div class="flex items-start w-full">
                    <input type="checkbox" class="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-4 flex-shrink-0 mt-1"
                      [checked]="item.isPurchased"
                      (change)="togglePurchased(item.id)">
                    <div class="flex-grow">
                      <p class="font-bold text-lg" [class.line-through]="item.isPurchased">{{ item.name }}</p>
                      <div class="flex items-center text-sm text-gray-500 space-x-4 flex-wrap">
                          <span>{{ item.category }}</span>
                          <span class="font-mono bg-gray-200 px-2 py-0.5 rounded">Est: {{ item.estimatedCost }} €</span>
                          <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                            [ngClass]="{
                              'bg-red-100 text-red-800': item.priority === 'Haute',
                              'bg-yellow-100 text-yellow-800': item.priority === 'Moyenne',
                              'bg-blue-100 text-blue-800': item.priority === 'Basse'
                            }">
                            Priorité {{ item.priority }}
                          </span>
                          <span>🗓️ {{ getMonthYear(item.purchaseMonth) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center flex-shrink-0 ml-4">
                    <button (click)="toggleDetails(item.id)" class="text-gray-400 hover:text-indigo-600 p-1 rounded-full transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </button>
                    <button (click)="removeItem(item.id)" class="text-gray-400 hover:text-red-600 p-1 rounded-full transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>

                <!-- Section Coût Réel (si acheté) -->
                @if (item.isPurchased) {
                  <div class="mt-3 pl-9 flex items-center space-x-2">
                      <label for="actualCost-{{item.id}}" class="text-sm font-medium">Coût Réel:</label>
                      <input type="number" id="actualCost-{{item.id}}" [value]="item.actualCost" (input)="updateActualCost(item.id, $event)" placeholder="Coût réel payé" class="w-32 px-2 py-1 border border-gray-300 rounded-md text-sm">
                      @if(item.actualCost != null) {
                        <span class="text-sm font-semibold" [ngClass]="(item.estimatedCost - item.actualCost) >= 0 ? 'text-green-600' : 'text-red-600'">
                          Économie: {{ item.estimatedCost - item.actualCost | number:'1.2-2' }} €
                        </span>
                      }
                  </div>
                }

                <!-- Section Détails (si dépliée) -->
                @if (expandedItemId() === item.id) {
                  <div class="mt-4 pt-4 border-t border-gray-200 pl-9 space-y-4 animate-fade-in">
                    <!-- Notation -->
                    <div>
                      <h4 class="font-semibold text-sm mb-1">Ma Note</h4>
                      <div class="flex items-center">
                        @for(star of [1,2,3,4,5]; track star) {
                          <button (click)="updateRating(item.id, star)" class="text-gray-300 hover:text-yellow-400">
                            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" [class.text-yellow-400]="item.rating && item.rating >= star"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                          </button>
                        }
                      </div>
                    </div>
                    <!-- Notes personnelles -->
                    <div>
                      <label for="notes-{{item.id}}" class="font-semibold text-sm mb-1 block">Notes Personnelles</label>
                      <textarea id="notes-{{item.id}}" [value]="item.notes || ''" (input)="updateNotes(item.id, $event)" rows="3" placeholder="Ex: Très confortable, bonne odeur mais ne tient pas longtemps..." class="input-style w-full"></textarea>
                    </div>
                    <!-- Photos -->
                    <div>
                      <h4 class="font-semibold text-sm mb-2">Photos</h4>
                      <div class="flex flex-wrap gap-2 mb-2">
                        @for(url of item.imageUrls; track url) {
                          <div class="relative group">
                            <img [src]="url" onerror="this.src='https://placehold.co/100x100/e2e8f0/94a3b8?text=Image'" alt="Photo de {{item.name}}" class="h-24 w-24 object-cover rounded-md">
                            <button (click)="removeImageUrl(item.id, url)" class="absolute top-0 right-0 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                          </div>
                        }
                      </div>
                      <form (submit)="addImageUrl(item.id, $event)" class="flex gap-2">
                        <input type="url" name="imageUrl" placeholder="https://... URL de l'image" class="input-style flex-grow text-sm">
                        <button type="submit" class="btn-secondary">Ajouter</button>
                      </form>
                    </div>
                    <!-- Liens -->
                    <div>
                      <h4 class="font-semibold text-sm mb-2">Liens Utiles</h4>
                      <div class="space-y-2 mb-2">
                         @for(link of item.links; track link.id) {
                          <div class="flex items-center gap-2 text-sm">
                            <a [href]="link.url" target="_blank" class="text-indigo-600 hover:underline flex-grow truncate">{{link.annotation}}: {{link.url}}</a>
                            <button (click)="removeLink(item.id, link.id)" class="text-red-500 font-bold">&times;</button>
                          </div>
                        }
                      </div>
                      <form (submit)="addLink(item.id, $event)" class="grid grid-cols-3 gap-2">
                        <input type="text" name="annotation" placeholder="Annotation (ex: Vente Privée)" class="input-style col-span-1 text-sm">
                        <input type="url" name="url" placeholder="https://... URL du lien" class="input-style col-span-2 text-sm">
                        <button type="submit" class="btn-secondary col-span-3">Ajouter le lien</button>
                      </form>
                    </div>
                  </div>
                }
              </div>
            } @empty {
              <div class="text-center py-10 px-6 bg-gray-50 rounded-lg">
                  <p class="text-gray-500">Aucun article planifié pour le moment.</p>
                  <p class="text-sm text-gray-400 mt-2">Utilisez le formulaire à gauche pour commencer.</p>
              </div>
            }
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .input-style {
      @apply mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm;
    }
    .filter-style {
      @apply block w-full sm:w-auto px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm;
    }
    .btn-secondary {
      @apply bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors duration-300 text-sm;
    }
    .animate-fade-in {
      animation: fadeIn 0.5s ease-in-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  // -- State Management with Signals --
  totalBudget = signal<number>(this.loadFromStorage('totalBudget', 1000));
  monthlyBudget = signal<number>(this.loadFromStorage('monthlyBudget', 500));
  items = signal<WardrobeItem[]>(this.loadFromStorage('wardrobeItems', []));
  expandedItemId = signal<number | null>(null);

  categoryFilter = signal<'Tous' | 'Vêtement' | 'Chaussures' | 'Parfum'>('Tous');
  priorityFilter = signal<'Tous' | 'Haute' | 'Moyenne' | 'Basse'>('Tous');
  sortOption = signal<'month' | 'cost_desc' | 'cost_asc'>('month');

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
    effect(() => {
      this.saveToStorage('wardrobeItems', this.items());
      this.saveToStorage('totalBudget', this.totalBudget());
      this.saveToStorage('monthlyBudget', this.monthlyBudget());
    });
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

    const newItem: WardrobeItem = {
      id: Date.now(),
      name: formData.get('name') as string,
      category: formData.get('category') as 'Vêtement' | 'Chaussures' | 'Parfum',
      estimatedCost: Number(formData.get('estimatedCost')),
      priority: formData.get('priority') as 'Haute' | 'Moyenne' | 'Basse',
      purchaseMonth: formData.get('purchaseMonth') as string,
      isPurchased: false,
      imageUrls: [],
      links: [],
    };

    this.items.update(currentItems => [...currentItems, newItem]);
    form.reset();
    (form.elements.namedItem('purchaseMonth') as HTMLInputElement).value = this.defaultMonth;
  }

  removeItem(id: number) {
    this.items.update(items => items.filter(item => item.id !== id));
  }

  togglePurchased(id: number) {
    this.items.update(items =>
      items.map(item => {
        if (item.id === id) {
          const isNowPurchased = !item.isPurchased;
          const actualCost = isNowPurchased ? item.actualCost : undefined;
          return { ...item, isPurchased: isNowPurchased, actualCost };
        }
        return item;
      })
    );
  }

  updateActualCost(id: number, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const cost = value === '' ? undefined : Number(value);

    this.items.update(items => items.map(item => item.id === id ? { ...item, actualCost: cost } : item));
  }

  toggleDetails(id: number) {
    this.expandedItemId.update(currentId => currentId === id ? null : id);
  }

  updateRating(id: number, rating: number) {
    this.items.update(items => items.map(item => item.id === id ? { ...item, rating } : item));
  }

  updateNotes(id: number, event: Event) {
    const notes = (event.target as HTMLTextAreaElement).value;
    this.items.update(items => items.map(item => item.id === id ? { ...item, notes } : item));
  }

  addImageUrl(id: number, event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const imageUrl = formData.get('imageUrl') as string;
    if (!imageUrl) return;

    this.items.update(items => items.map(item => {
      if (item.id === id) {
        const updatedImages = [...(item.imageUrls || []), imageUrl];
        return { ...item, imageUrls: updatedImages };
      }
      return item;
    }));
    form.reset();
  }

  removeImageUrl(id: number, urlToRemove: string) {
    this.items.update(items => items.map(item => {
      if (item.id === id) {
        const updatedImages = (item.imageUrls || []).filter(url => url !== urlToRemove);
        return { ...item, imageUrls: updatedImages };
      }
      return item;
    }));
  }

  addLink(id: number, event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const url = formData.get('url') as string;
    const annotation = formData.get('annotation') as string;
    if (!url || !annotation) return;

    const newLink: ItemLink = { id: Date.now(), url, annotation };

    this.items.update(items => items.map(item => {
      if (item.id === id) {
        const updatedLinks = [...(item.links || []), newLink];
        return { ...item, links: updatedLinks };
      }
      return item;
    }));
    form.reset();
  }

  removeLink(id: number, linkIdToRemove: number) {
     this.items.update(items => items.map(item => {
      if (item.id === id) {
        const updatedLinks = (item.links || []).filter(link => link.id !== linkIdToRemove);
        return { ...item, links: updatedLinks };
      }
      return item;
    }));
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
    const [year, month] = dateString.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  private saveToStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Error saving to localStorage', e);
    }
  }

  private loadFromStorage<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Error reading from localStorage', e);
      return defaultValue;
    }
  }
}

