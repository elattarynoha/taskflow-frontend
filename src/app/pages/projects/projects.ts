import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';

interface Project {
  id: number;
  name: string;
  description: string;
  ownerEmail: string;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './projects.html',
  styleUrl: './projects.css'
})
export class Projects implements OnInit {
  projects: Project[] = [];
  newProjectName = '';
  newProjectDescription = '';
  isLoading = false;
  errorMessage = '';

  private apiUrl = 'http://localhost:8080/api/projects';

  constructor(
    private http: HttpClient,
    private authService: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.isLoading = true;
    this.http.get<Project[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.projects = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load projects';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  createProject(): void {
    if (!this.newProjectName.trim()) return;

    this.http.post<Project>(this.apiUrl, {
      name: this.newProjectName,
      description: this.newProjectDescription
    }).subscribe({
      next: (project) => {
        this.projects.push(project);
        this.newProjectName = '';
        this.newProjectDescription = '';
      },
      error: (err) => {
        this.errorMessage = 'Failed to create project';
        console.error(err);
      }
    });
  }

  deleteProject(id: number): void {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.projects = this.projects.filter(p => p.id !== id);
      },
      error: (err) => {
        this.errorMessage = 'Failed to delete project';
        console.error(err);
      }
    });
  }

  openProject(id: number): void {
    this.router.navigate(['/projects', id]);
  }

  logout(): void {
    this.authService.logout();
  }
}