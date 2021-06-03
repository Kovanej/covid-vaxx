import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { InsuranceCompany } from '@app/model/InsuranceCompany';
import { ControlContainer, FormControl, FormGroup, NgForm, ValidationErrors, Validators } from '@angular/forms';
import { PatientData, patientDataLabels } from '@app/model/PatientData';

@Component({
  selector: 'app-patient-info-form',
  templateUrl: './patient-info-form.component.html',
  styleUrls: ['./patient-info-form.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class PatientInfoFormComponent implements OnInit {

  @Input() patient?: PatientData;
  @Input() showExtraFields: boolean = false;
  @Input() vertical: boolean = false;
  @Output() missingInfo: EventEmitter<string[]> = new EventEmitter<string[]>();
  @Output() patientUpdated: EventEmitter<PatientData> = new EventEmitter<PatientData>();

  public allInsuranceCompanies: string[] = Object.values(InsuranceCompany);
  public minVaccinationDate = new Date('1/1/2020');
  public maxVaccinationDate = new Date();

  public form: FormGroup = new FormGroup({
    firstName: new FormControl('', [Validators.required]),
    lastName: new FormControl('', [Validators.required]),
    personalNumber: new FormControl('', [Validators.required]),
    insuranceCompany: new FormControl('', [Validators.required]),
    phoneNumber: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required]),
    zipCode: new FormControl('', [Validators.required]),
    district: new FormControl('', [Validators.required]),
    indication: new FormControl('')
  });

  constructor() {
    this.form.valueChanges.subscribe(() => {

      // Pass invalid info to parent component
      const invalid = [];
      const controls = this.form.controls;

      for (const name in controls) {
        if (controls[name].invalid) {
          invalid.push(patientDataLabels[name]);
        }
      }

      this.missingInfo.emit(invalid);
      this.patientUpdated.emit(this.form.value);

    });
  }

  ngOnInit() {
    if (!this.patient) {
      return;
    }

    this.form.setValue({
      firstName: this.patient.firstName,
      lastName: this.patient.lastName,
      personalNumber: this.patient.personalNumber,
      insuranceCompany: this.patient.insuranceCompany ?? null,
      phoneNumber: this.patient.phoneNumber,
      email: this.patient.email,
      zipCode: this.patient.zipCode,
      district: this.patient.district,
      indication: this.patient.indication ?? null
    });
  }

  public isControlInvalid(controlName: string): boolean {
    const control = this.form.controls[controlName];
    if (!control) {
      return true;
    }

    return control.invalid && (control.dirty || control.touched);
  }

  public getControlErrors(controlName: string): ValidationErrors | null {
    const control = this.form.controls[controlName];
    if (!control) {
      return null;
    }

    return control.errors;
  }
}
