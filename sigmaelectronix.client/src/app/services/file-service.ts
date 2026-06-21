import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FileService {
  private http = inject(HttpClient);
  private baseUrl = '/api/file';

  // Обычная загрузка (старый метод)
  uploadImage(file: File, folder: string, entityId?: string): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    let url = `${this.baseUrl}/upload?folder=${folder}`;
    if (entityId) url += `&entityId=${entityId}`;

    return this.http.post<{ url: string }>(url, formData);
  }

  // 🚀 НОВЫЙ МЕТОД: Загрузка с отслеживанием прогресса (Progress Bar)
  uploadImageWithProgress(file: File, folder: string, entityId?: string): Observable<HttpEvent<{ url: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    let url = `${this.baseUrl}/upload?folder=${folder}`;
    if (entityId) url += `&entityId=${entityId}`;

    // Создаем запрос с включенным reportProgress
    const req = new HttpRequest('POST', url, formData, {
      reportProgress: true,
      responseType: 'json'
    });

    return this.http.request<{ url: string }>(req);
  }

  deleteImage(fileUrl: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delete?url=${encodeURIComponent(fileUrl)}`);
  }

  getFilesList(folder?: string): Observable<any> {
    let url = `${this.baseUrl}/list`;
    if (folder) {
      url += `?folder=${encodeURIComponent(folder)}`;
    }
    return this.http.get<any>(url);
  }
}
