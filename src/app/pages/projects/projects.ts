import { Component, OnInit, signal } from '@angular/core';
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
  startDate: string | null;
  dueDate: string | null;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './projects.html',
  styleUrl: './projects.css'
})
export class Projects implements OnInit {
  projects = signal<Project[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  // Modal state
  showModal = signal(false);
  modalMode = signal<'create' | 'edit'>('create');
  editingProjectId: number | null = null;
  formName = '';
  formDescription = '';
  formStartDate = '';
  formDueDate = '';

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
    this.isLoading.set(true);
    this.http.get<Project[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.projects.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load projects');
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  openCreateModal(): void {
    this.modalMode.set('create');
    this.formName = '';
    this.formDescription = '';
    this.formStartDate = '';
    this.formDueDate = '';
    this.showModal.set(true);
  }

  openEditModal(project: Project, event: Event): void {
    event.stopPropagation();
    this.modalMode.set('edit');
    this.editingProjectId = project.id;
    this.formName = project.name;
    this.formDescription = project.description;
    this.formStartDate = project.startDate ?? '';
    this.formDueDate = project.dueDate ?? '';
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  submitModal(): void {
    if (!this.formName.trim()) return;

    const payload = {
      name: this.formName,
      description: this.formDescription,
      startDate: this.formStartDate || null,
      dueDate: this.formDueDate || null
    };

    if (this.modalMode() === 'create') {
      this.http.post<Project>(this.apiUrl, payload).subscribe({
        next: (project) => {
          this.projects.update(list => [...list, project]);
          this.closeModal();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message ?? 'Failed to create project');
          console.error(err);
        }
      });
    } else {
      this.http.patch<Project>(`${this.apiUrl}/${this.editingProjectId}`, payload).subscribe({
        next: (updated) => {
          this.projects.update(list =>
            list.map(p => p.id === updated.id ? updated : p)
          );
          this.closeModal();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message ?? 'Failed to update project');
          console.error(err);
        }
      });
    }
  }

  deleteProject(id: number, event: Event): void {
    event.stopPropagation();
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.projects.update(list => list.filter(p => p.id !== id));
      },
      error: (err) => {
        this.errorMessage.set('Failed to delete project');
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