import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  email = '';
  password = '';
  fullName = '';
  errorMessage = signal('');
  isLoading = signal(false);

  constructor(private authService: Auth, private router: Router) {}

  onSubmit(): void {
    this.errorMessage.set('');
    this.isLoading.set(true);

    this.authService.register({
      email: this.email,
      password: this.password,
      fullName: this.fullName
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/projects']);
      },
      error: (err) => {
        this.isLoading.set(false);

        if (err.status === 409) {
          this.errorMessage.set('Cette adresse e-mail est déjà utilisée.');
        } else if (err.status === 400 && err.error?.validationErrors) {
          this.errorMessage.set(Object.values(err.error.validationErrors).join(' '));
        } else {
          this.errorMessage.set(
            err.error?.message || 'Une erreur est survenue. Veuillez réessayer.'
          );
        }
      }
    });
  }
}