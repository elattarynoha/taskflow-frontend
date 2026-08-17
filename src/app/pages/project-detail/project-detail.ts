import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Task, TaskStatus } from '../../models/task.model';

interface Project {
  id: number;
  name: string;
  description: string;
  ownerEmail: string;
}

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DragDropModule],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.css'
})
export class ProjectDetail implements OnInit {
  project: Project | null = null;
  projectId!: number;

  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  doneTasks: Task[] = [];

  newTaskTitle = '';
  newTaskDescription = '';
  isLoading = false;
  errorMessage = '';

  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProject();
    this.loadTasks();
  }

  loadProject(): void {
    this.http.get<Project>(`${this.apiUrl}/projects/${this.projectId}`).subscribe({
      next: (data) => this.project = data,
      error: (err) => {
        this.errorMessage = 'Project not found';
        console.error(err);
      }
    });
  }

  loadTasks(): void {
    this.isLoading = true;
    this.http.get<Task[]>(`${this.apiUrl}/projects/${this.projectId}/tasks`).subscribe({
      next: (tasks) => {
        this.todoTasks = tasks.filter(t => t.status === 'TODO');
        this.inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
        this.doneTasks = tasks.filter(t => t.status === 'DONE');
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load tasks';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  createTask(): void {
    if (!this.newTaskTitle.trim()) return;

    this.http.post<Task>(`${this.apiUrl}/projects/${this.projectId}/tasks`, {
      title: this.newTaskTitle,
      description: this.newTaskDescription,
      status: 'TODO'
    }).subscribe({
      next: (task) => {
        this.todoTasks.push(task);
        this.newTaskTitle = '';
        this.newTaskDescription = '';
      },
      error: (err) => {
        this.errorMessage = 'Failed to create task';
        console.error(err);
      }
    });
  }

  deleteTask(task: Task): void {
    this.http.delete(`${this.apiUrl}/tasks/${task.id}`).subscribe({
      next: () => {
        this.removeFromLocalLists(task.id);
      },
      error: (err) => {
        this.errorMessage = 'Failed to delete task';
        console.error(err);
      }
    });
  }

  private removeFromLocalLists(taskId: number): void {
    this.todoTasks = this.todoTasks.filter(t => t.id !== taskId);
    this.inProgressTasks = this.inProgressTasks.filter(t => t.id !== taskId);
    this.doneTasks = this.doneTasks.filter(t => t.id !== taskId);
  }

  drop(event: CdkDragDrop<Task[]>, newStatus: TaskStatus): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    const task = event.previousContainer.data[event.previousIndex];

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    this.http.patch<Task>(`${this.apiUrl}/tasks/${task.id}`, { status: newStatus }).subscribe({
      error: (err) => {
        this.errorMessage = 'Failed to update task status';
        console.error(err);
        this.loadTasks();
      }
    });
  }
}