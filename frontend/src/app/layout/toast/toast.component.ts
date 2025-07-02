import { Component } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: false,
  template: `
    <div *ngIf="toastService.toast$ | async as toast"
         class="fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white animate-fadeInUp transition-all"
         [ngClass]="{
           'bg-green-600': toast.type === 'success',
           'bg-red-600': toast.type === 'error',
           'bg-blue-600': toast.type === 'info'
         }">
      {{ toast.message }}
    </div>
  `,
  styles: [`
    .animate-fadeInUp {
      animation: fadeInUp 0.3s ease-out;
    }
    @keyframes fadeInUp {
      0% { opacity: 0; transform: translateY(10px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
}
