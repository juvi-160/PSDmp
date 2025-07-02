import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastSubject = new BehaviorSubject<Toast | null>(null);
  toast$ = this.toastSubject.asObservable();

  show(message: string, type: Toast['type'] = 'info') {
    this.toastSubject.next({ message, type });
    setTimeout(() => this.toastSubject.next(null), 3000); // auto-hide
  }
}
