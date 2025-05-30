import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeDE from '@angular/common/locales/de';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Deutsche Locale-Daten registrieren
registerLocaleData(localeDE);

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
