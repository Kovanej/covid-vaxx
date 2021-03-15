import { Component, Input, OnInit } from '@angular/core';
import { Patient } from '@app/model/Patient';
import { InsuranceCompany } from '@app/model/InsuranceCompany';

@Component({
  selector: 'app-patient-info-form',
  templateUrl: './patient-info-form.component.html',
  styleUrls: ['./patient-info-form.component.scss']
})
export class PatientInfoFormComponent implements OnInit {

  @Input() patient?: Patient;

  public allInsuranceCompanies: string[] = Object.values(InsuranceCompany);

  constructor() {
  }

  ngOnInit(): void {
  }

}
