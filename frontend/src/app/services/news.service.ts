import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NewsItem {
  id?: number;
  title: string;
  description: string;
  date: string;
  image?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private apiUrl = 'https://join.psfhyd.org/api';

  constructor(private http: HttpClient) { }

  getNews(): Observable<NewsItem[]> {
    return this.http.get<NewsItem[]>(`${this.apiUrl}/news`);
  }

  addNews(news: NewsItem): Observable<NewsItem> {
    return this.http.post<NewsItem>(`${this.apiUrl}/news`, news);
  }

  updateNews(news: NewsItem): Observable<NewsItem> {
    return this.http.put<NewsItem>(`${this.apiUrl}/news/${news.id}`, news);
  }

  deleteNews(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/news/${id}`);
  }
}