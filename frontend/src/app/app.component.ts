import { Component, OnInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})

export class AppComponent implements OnInit {
  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    const role = localStorage.getItem('userRole') || 'individual';

    // Clean previous classes
    this.renderer.removeClass(document.body, 'admin-theme');
    this.renderer.removeClass(document.body, 'associate-theme');
    this.renderer.removeClass(document.body, 'individual-theme');

    // Add based on role
    if (role === 'admin') {
      this.renderer.addClass(document.body, 'admin-theme');
    } else if (role === 'associate member') {
      this.renderer.addClass(document.body, 'associate-theme');
    } else {
      this.renderer.addClass(document.body, 'individual-theme');
    }
  }
}