import { Injectable } from '@angular/core';

import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private toastr: ToastrService) { }


  showSuccess(message: string, tittle:string) {
    this.toastr.success(message, tittle);
  }

  showError(message: string, tittle:string) {

    this.toastr.error(message, tittle);
  }

  showWarning(message: string, tittle:string) {

    this.toastr.warning(message, tittle);
  }

  showInfo(message: string, tittle:string) {
    this.toastr.info(message, tittle);
  }

}
