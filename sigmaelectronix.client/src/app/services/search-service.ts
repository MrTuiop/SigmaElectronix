import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SearchSuggestDto } from '../models/search-models';


@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/search';

  // Метод для получения подсказок
  getSuggestions(query: string): Observable<SearchSuggestDto> {
    return this.http.get<SearchSuggestDto>(`${this.baseUrl}/suggest?query=${query}`);
  }
}
