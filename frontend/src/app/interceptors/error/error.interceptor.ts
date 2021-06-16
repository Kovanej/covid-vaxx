import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '@app/services/auth/auth.service';
import { catchError } from 'rxjs/operators';
import { PatientRegistrationDtoIn } from '@app/generated';
import { environment } from '@environments/environment';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(private _authService: AuthService) {
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const companyEmail = environment.companyEmail;

    return next.handle(request).pipe(catchError(err => {

      const error = err.error;
      const requestId = error?.requestId;
      const serverMessage = error?.message;

      const defaultMessageSuffix = serverMessage ? ` Zpráva ze serveru: "${serverMessage}".` : '';
      const defaultMessage = `Něco se pokazilo. Zkuste to prosím znovu.${defaultMessageSuffix}`;
      const defaultSubject = 'Problém na webu';

      let message = defaultMessage;
      let contactMessage = 'V případě potíží nás kontaktujte na';
      let emailSubject = defaultSubject;

      if (err.status === 401) {
        // auto logout if 401 response returned from api
        this._authService.logout();
        message = 'Špatné přihlašovací údaje. Zkuste to prosím znovu.';
      } else if (err.status === 403) {
        message = 'Přístup byl odmítnut.';
        emailSubject = 'Požadavek na udělení přístupu';
      } else if (err.status === 404) {
        const url = 'ockovani.praha7.cz';
        message = 'Je nám líto, ale Vašemu dotazu nic neodpovídá. ' +
          'Zkontrolujte prosím, že zadáváte správné údaje. ' +
          `Případně nechte pacienta znovu registrovat na <a href="${url}" target="_blank">${url}</a>.<br><br>`;
      } else if (err.status === 406) {
        message = 'Nepodařila se validace Vaší osoby v registru osob. Prosím, zkontrolujte, že máte zadané spávné jméno, příjmení a rodné číslo.';
      } else if (err.status === 409) {

        message = 'Myslíme si, že pacient s Vašimi údaji je již registrován.';
        contactMessage = 'Pokud potřebujete opravit svoji registraci, napište nám na';

        emailSubject = 'Problém s registaci nového pacienta';
        const personalNumber = (request.body as PatientRegistrationDtoIn).personalNumber;
        if (personalNumber) {
          emailSubject += ` s rodným číslem ${personalNumber}`;
        }
      } else if (err.status === 429) {
        message = 'Server je zahlcen požadavky, zkuste to prosím za hodinu znovu.';
      } else if (err.status === 0) {
        message = 'Zkontrolujte prosím své připojení k internetu a znovu načtěte stránku.';
      }

      emailSubject += requestId ? ` (ID požadavku: ${requestId})` : '';
      message += ` ${contactMessage} <a href="mailto:${companyEmail}?subject=${emailSubject}">${companyEmail}</a>.`;
      message += requestId ? ` Při komunikaci uveďte ID požadavku: <b>${requestId}</b>.` : '';

      throw new Error(message);
    }));
  }
}
