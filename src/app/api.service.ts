import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Note: The WardrobeItem and ItemLink interfaces should be moved to a separate models file.
// I will do this refactoring later if I have time.
export interface ItemLink {
  id: number;
  url: string;
  annotation: string;
}

export interface WardrobeItem {
  id: number;
  name: string;
  category: 'Vêtement' | 'Chaussures' | 'Parfum';
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


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  getItems(): Observable<WardrobeItem[]> {
    return this.http.get<WardrobeItem[]>(`${this.apiUrl}/items`);
  }

  createItem(item: Omit<WardrobeItem, 'id' | 'isPurchased' | 'imageUrls' | 'links'>): Observable<WardrobeItem> {
    return this.http.post<WardrobeItem>(`${this.apiUrl}/items`, item);
  }

  deleteItem(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/items/${id}`);
  }

  updateItem(id: number, updates: Partial<WardrobeItem>): Observable<WardrobeItem> {
    return this.http.put<WardrobeItem>(`${this.apiUrl}/items/${id}`, updates);
  }

  addImageUrl(id: number, imageUrl: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/items/${id}/images`, { imageUrl });
  }

  removeImageUrl(id: number, imageUrl: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/items/${id}/images`, { body: { imageUrl } });
  }

  addLink(id: number, link: Omit<ItemLink, 'id'>): Observable<ItemLink> {
    return this.http.post<ItemLink>(`${this.apiUrl}/items/${id}/links`, link);
  }

  removeLink(itemId: number, linkId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/items/${itemId}/links/${linkId}`);
  }
}
