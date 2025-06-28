import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-invite',
  standalone: false,
  templateUrl: './invite.component.html',
  styleUrl: './invite.component.css'
})
export class InviteComponent implements OnInit {
  email: string = '';
  password: string = '';
  users: any[] = [];

  private apiBase = 'https://api.psfhyd.org/api/invite';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadUsers();
  }

  sendInvite() {
    if (!this.email || !this.password) {
      alert('Please enter both email and password');
      return;
    }

    this.http.post(`${this.apiBase}/send-invite`, {
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        alert('✅ Invitation sent & user created.');
        this.email = '';
        this.password = '';
        this.loadUsers();
      },
      error: err => alert('❌ Error: ' + (err.error?.error || err.message || 'Unknown error'))
    });
  }

  loadUsers() {
    this.http.get(`${this.apiBase}/users`).subscribe({
      next: (data: any) => this.users = data,
      error: err => alert('❌ Failed to load users: ' + err.message)
    });
  }

  updatePassword(user: any) {
    if (!user.newPassword) return alert('Please enter a new password');

    this.http.patch(`${this.apiBase}/users/${user.user_id}`, { password: user.newPassword })
      .subscribe({
        next: () => {
          alert('✅ Password updated');
          user.newPassword = '';
        },
        error: err => alert('❌ Update failed: ' + err.message)
      });
  }

  deleteUser(user: any) {
    if (!confirm(`Are you sure you want to delete ${user.email}?`)) return;

    this.http.delete(`${this.apiBase}/users/${user.user_id}`)
      .subscribe({
        next: () => {
          alert('🗑️ User deleted');
          this.users = this.users.filter(u => u.user_id !== user.user_id);
        },
        error: err => alert('❌ Delete failed: ' + err.message)
      });
  }
}