import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Task, TaskStatus, TaskPriority } from '../../models/task.model';

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
  project = signal<Project | null>(null);
  projectId!: number;

  todoTasks = signal<Task[]>([]);
  inProgressTasks = signal<Task[]>([]);
  doneTasks = signal<Task[]>([]);

  newTaskTitle = '';
  newTaskDescription = '';
  newTaskPriority: TaskPriority = 'MEDIUM';
  isLoading = signal(false);
  errorMessage = signal('');

  // Rename project state
  isEditingName = signal(false);
  editedName = '';

  // Edit task modal state
  showTaskModal = signal(false);
  editingTask: Task | null = null;
  editTaskTitle = '';
  editTaskDescription = '';
  editTaskPriority: TaskPriority = 'MEDIUM';

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
      next: (data) => this.project.set(data),
      error: (err) => {
        this.errorMessage.set('Project not found');
        console.error(err);
      }
    });
  }

  loadTasks(): void {
    this.isLoading.set(true);
    this.http.get<Task[]>(`${this.apiUrl}/projects/${this.projectId}/tasks`).subscribe({
      next: (tasks) => {
        this.todoTasks.set(tasks.filter(t => t.status === 'TODO'));
        this.inProgressTasks.set(tasks.filter(t => t.status === 'IN_PROGRESS'));
        this.doneTasks.set(tasks.filter(t => t.status === 'DONE'));
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to load tasks');
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  createTask(): void {
    if (!this.newTaskTitle.trim()) return;

    this.http.post<Task>(`${this.apiUrl}/projects/${this.projectId}/tasks`, {
      title: this.newTaskTitle,
      description: this.newTaskDescription,
      status: 'TODO',
      priority: this.newTaskPriority
    }).subscribe({
      next: (task) => {
        this.todoTasks.update(list => [...list, task]);
        this.newTaskTitle = '';
        this.newTaskDescription = '';
        this.newTaskPriority = 'MEDIUM';
      },
      error: (err) => {
        this.errorMessage.set('Failed to create task');
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
        this.errorMessage.set('Failed to delete task');
        console.error(err);
      }
    });
  }

  private removeFromLocalLists(taskId: number): void {
    this.todoTasks.update(list => list.filter(t => t.id !== taskId));
    this.inProgressTasks.update(list => list.filter(t => t.id !== taskId));
    this.doneTasks.update(list => list.filter(t => t.id !== taskId));
  }

  private listSignalFor(status: TaskStatus) {
    return {
      TODO: this.todoTasks,
      IN_PROGRESS: this.inProgressTasks,
      DONE: this.doneTasks
    }[status];
  }

  drop(event: CdkDragDrop<Task[]>, newStatus: TaskStatus): void {
    if (event.previousContainer === event.container) {
      const list = [...event.container.data];
      moveItemInArray(list, event.previousIndex, event.currentIndex);
      this.listSignalFor(newStatus).set(list);
      return;
    }

    const previousList = [...event.previousContainer.data];
    const currentList = [...event.container.data];
    const task = previousList[event.previousIndex];
    const previousStatus = task.status;

    transferArrayItem(
      previousList,
      currentList,
      event.previousIndex,
      event.currentIndex
    );

    this.listSignalFor(previousStatus).set(previousList);
    this.listSignalFor(newStatus).set(currentList);

    this.http.patch<Task>(`${this.apiUrl}/tasks/${task.id}`, { status: newStatus }).subscribe({
      error: (err) => {
        this.errorMessage.set('Failed to update task status');
        console.error(err);
        this.loadTasks();
      }
    });
  }

  // --- Rename project ---

  startEditName(): void {
    const current = this.project();
    if (!current) return;
    this.editedName = current.name;
    this.isEditingName.set(true);
  }

  saveProjectName(): void {
    const current = this.project();
    if (!this.editedName.trim() || !current) {
      this.isEditingName.set(false);
      return;
    }

    if (this.editedName.trim() === current.name) {
      this.isEditingName.set(false);
      return;
    }

    this.http.patch<Project>(`${this.apiUrl}/projects/${this.projectId}`, {
      name: this.editedName.trim()
    }).subscribe({
      next: (updated) => {
        this.project.set(updated);
        this.isEditingName.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Failed to rename project');
        console.error(err);
        this.isEditingName.set(false);
      }
    });
  }

  cancelEditName(): void {
    this.isEditingName.set(false);
  }

  // --- Edit task ---

  openEditTaskModal(task: Task, event: Event): void {
    event.stopPropagation();
    this.editingTask = task;
    this.editTaskTitle = task.title;
    this.editTaskDescription = task.description;
    this.editTaskPriority = task.priority;
    this.showTaskModal.set(true);
  }

  closeTaskModal(): void {
    this.showTaskModal.set(false);
    this.editingTask = null;
  }

  saveTaskEdit(): void {
    if (!this.editingTask || !this.editTaskTitle.trim()) return;

    const taskId = this.editingTask.id;
    const originalStatus = this.editingTask.status;

    this.http.patch<Task>(`${this.apiUrl}/tasks/${taskId}`, {
      title: this.editTaskTitle.trim(),
      description: this.editTaskDescription,
      priority: this.editTaskPriority
    }).subscribe({
      next: (updated) => {
        this.listSignalFor(originalStatus).update(list =>
          list.map(t => t.id === updated.id ? updated : t)
        );
        this.closeTaskModal();
      },
      error: (err) => {
        this.errorMessage.set('Failed to update task');
        console.error(err);
      }
    });
  }
}