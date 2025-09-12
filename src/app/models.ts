export interface ItemLink {
  id: number;
  url: string;
  annotation: string;
}

export interface WardrobeItem {
  id: number;
  name: string;
  category: 'Vêtement' | 'Chaussures' | 'Parfum';
  status: 'inbox' | 'planned';
  estimatedCost: number;
  actualCost?: number;
  priority: 'Haute' | 'Moyenne' | 'Basse';
  purchaseMonth: string; // Format YYYY-MM
  isPurchased: boolean;
  purchaseDate?: Date;
  notes?: string;
  rating?: number; // de 1 à 5
  imageUrls?: string[];
  links?: ItemLink[];
}

export interface PlanningSummary {
  totalCost: number;
  costByMonth: { name: string; value: number }[];
  countByCategory: { name: string; value: number }[];
}
