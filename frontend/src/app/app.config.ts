import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { provideNativeDateAdapter } from '@angular/material/core';
import { authInterceptor } from './interceptors/auth.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    provideNativeDateAdapter(),
    provideToastr({
      timeOut: 4000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true,
      progressAnimation: 'increasing',
      closeButton: true,
      enableHtml: false,
      tapToDismiss: true,
      toastClass: 'ngx-toastr modern-toast',
      maxOpened: 2,
      autoDismiss: true,
      newestOnTop: true,
      includeTitleDuplicates: false,
      resetTimeoutOnDuplicate: false,
      easeTime: 300,
      easing: 'ease-out',
      iconClasses: {
        error: 'toast-error',
        info: 'toast-info', 
        success: 'toast-success',
        warning: 'toast-warning'
      }
    })
  ]
};
