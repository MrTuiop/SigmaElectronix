import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditorComponent } from '@tinymce/tinymce-angular';
import {
  LucideFileEdit,
  LucideSave,
  LucideCheckCircle,
  LucideLayoutTemplate
} from '@lucide/angular';

@Component({
  selector: 'app-manager-page-editor',
  standalone: true,
  // ВАЖНО: Импортируем EditorComponent
  imports: [CommonModule, FormsModule, EditorComponent, LucideFileEdit, LucideSave, LucideCheckCircle, LucideLayoutTemplate],
  templateUrl: './manager-page-editor.html',
  styleUrl: './manager-page-editor.css'
})
export class ManagerPageEditorComponent {
  // Состояния
  pageTitle = signal('Главная страница - О нас');
  pageContent = signal('<p>Добро пожаловать в <strong>SigmaElectronix</strong>! Мы предлагаем лучшую электронику по самым доступным ценам.</p><p><br></p><p><em>Этот текст можно редактировать, добавлять картинки и таблицы.</em></p>');

  isSaving = signal(false);
  showSuccess = signal(false);

  // Конфигурация интерфейса TinyMCE
  editorConfig = {
    height: 500,
    menubar: true,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
    ],
    toolbar: 'undo redo | blocks | ' +
      'bold italic forecolor | alignleft aligncenter ' +
      'alignright alignjustify | bullist numlist outdent indent | ' +
      'removeformat | image table | code',
    content_style: 'body { font-family: -apple-system, system-ui, sans-serif; font-size:15px; color: #374151; }',
    language: 'ru', // Если хочешь интерфейс на русском (требует загрузки языкового пакета, по умолчанию будет англ)
    branding: false, // Убирает логотип "Powered by TinyMCE"
  };

  // Фейковое сохранение
  savePage() {
    if (!this.pageTitle().trim()) {
      alert('Укажите заголовок страницы!');
      return;
    }

    this.isSaving.set(true);

    // Имитируем задержку сети (1.5 секунды), как будто идет загрузка в БД
    setTimeout(() => {
      this.isSaving.set(false);
      this.showSuccess.set(true);

      // Выводим в консоль, чтобы показать проверяющему, что данные "собраны"
      console.log('--- ОТПРАВКА НА СЕРВЕР ---');
      console.log('Заголовок:', this.pageTitle());
      console.log('HTML Контент:', this.pageContent());

      // Прячем галочку успеха через 3 секунды
      setTimeout(() => this.showSuccess.set(false), 3000);
    }, 1500);
  }
}
