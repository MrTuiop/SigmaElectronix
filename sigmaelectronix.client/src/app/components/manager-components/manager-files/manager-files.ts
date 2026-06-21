import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileService } from '../../../services/file-service';
import {
  LucideFolder, LucideTrash2, LucideArrowLeft,
  LucideHardDrive, LucideLink, LucideUnlink, LucideExternalLink
} from '@lucide/angular';
import { SpinnerComponent } from '../../ui-components/spinner/spinner';

interface FolderItem {
  name: string;
  filesCount: number;
}

interface FileItem {
  name: string;
  url: string;
  sizeInBytes: number;
  createdAt: string;
  entityName: string | null; // <-- Если null, значит это мусор!
}

@Component({
  selector: 'app-manager-files',
  standalone: true,
  imports: [
    CommonModule,
    LucideFolder, LucideTrash2, LucideArrowLeft,
    LucideHardDrive, LucideLink, LucideUnlink, LucideExternalLink,
    SpinnerComponent
  ],
  templateUrl: './manager-files.html',
  styleUrl: './manager-files.css'
})
export class ManagerFilesComponent implements OnInit {
  private fileService = inject(FileService);

  loading = signal(false);
  currentFolder = signal<string | null>(null); // Если null - показываем папки

  folders = signal<FolderItem[]>([]);
  files = signal<FileItem[]>([]);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    const folder = this.currentFolder();

    this.fileService.getFilesList(folder || undefined).subscribe({
      next: (res) => {
        if (!folder) {
          this.folders.set(res.folders);
          this.files.set([]);
        } else {
          this.files.set(res.files);
        }
        this.loading.set(false);
      },
      error: () => {
        alert('Ошибка при загрузке файлов');
        this.loading.set(false);
      }
    });
  }

  openFolder(folderName: string): void {
    this.currentFolder.set(folderName);
    this.loadData();
  }

  goBack(): void {
    this.currentFolder.set(null);
    this.loadData();
  }

  deleteFile(file: FileItem): void {
    const warning = file.entityName
      ? `ВНИМАНИЕ! Этот файл привязан к "${file.entityName}". Если вы его удалите, картинка пропадет с сайта!\n\nВы уверены?`
      : `Вы уверены, что хотите удалить непривязанный файл ${file.name}?`;

    if (confirm(warning)) {
      this.loading.set(true);
      this.fileService.deleteImage(file.url).subscribe({
        next: () => {
          // Мгновенно убираем из интерфейса
          this.files.update(prev => prev.filter(f => f.url !== file.url));
          this.loading.set(false);
        },
        error: () => {
          alert('Не удалось удалить файл');
          this.loading.set(false);
        }
      });
    }
  }

  formatBytes(bytes: number, decimals = 1): string {
    if (!+bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }
}
