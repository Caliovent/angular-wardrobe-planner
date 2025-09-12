import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WardrobeItem, ItemLink, PlanningSummary } from './models';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  register(userInfo: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userInfo);
  }

  login(credentials: any): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/auth/login`, credentials);
  }

  getItems(status?: string): Observable<WardrobeItem[]> {
    let url = `${this.apiUrl}/items`;
    if (status) {
      url += `?status=${status}`;
    }
    return this.http.get<WardrobeItem[]>(url);
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

  createItemFromUrl(url: string, name: string): Observable<WardrobeItem> {
    return this.http.post<WardrobeItem>(`${this.apiUrl}/items/from-url`, { url, name });
  }

  uploadItemImage(file: File): Observable<WardrobeItem> {
    const formData = new FormData();
    formData.append('image', file, file.name);

    return this.http.post<WardrobeItem>(`${this.apiUrl}/items/upload-image`, formData);
  }

  getPlanningSummary(): Observable<PlanningSummary> {
    return this.http.get<PlanningSummary>(`${this.apiUrl}/planning/summary`);
  }

  getUserProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/user/me`);
  }

  updateUserBudgets(budgets: { totalBudget: number; monthlyBudget: number }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/user/budgets`, budgets);
  }
}
