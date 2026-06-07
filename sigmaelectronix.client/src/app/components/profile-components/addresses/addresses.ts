import { Component, inject } from '@angular/core';
import { LucidePlus, LucideMapPin } from '@lucide/angular';
import { ProfileService } from '../../../services/profile-service';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [
    LucidePlus, LucideMapPin
  ],
  templateUrl: './addresses.html',
  styleUrl: './addresses.css',
})
export class AddressesComponent {
  data = inject(ProfileService);

  addAddress() {
    // Заглушка – позже можно открыть модальное окно
    console.log('Добавить новый адрес');
  }

  editAddress(id: number) {
    console.log('Редактировать адрес', id);
  }

  deleteAddress(id: number) {
    // Тут должна быть логика удаления из сигнала
    console.log('Удалить адрес', id);
  }
}
