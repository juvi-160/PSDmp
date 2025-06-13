import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-terms-conditions',
  standalone: false,
  templateUrl: './terms-conditions.component.html',
  styleUrl: './terms-conditions.component.css'
})
export class TermsConditionsComponent implements OnInit {

  constructor(private titleService: Title) { }

  ngOnInit(): void {
    this.titleService.setTitle('Terms & Conditions - Professionals Solidarity Forum');
    // Scroll to top when component loads
    window.scrollTo(0, 0);
  }
}