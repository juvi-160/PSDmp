import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-invite',
  standalone: false,
  templateUrl: './invite.component.html',
  styleUrl: './invite.component.css'
})
export class InviteComponent {
  email: string = '';

  constructor(private http: HttpClient) {}

  sendInvite() {
    if (!this.email) return;

    this.http.post('http://localhost:3000/api/invite/send-invite', { email: this.email })
      .subscribe({
        next: () => alert('Invite sent!'),
        error: (err) => alert('Error sending invite: ' + err.message)
      });
  }
}