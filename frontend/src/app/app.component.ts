import { Component, OnInit } from '@angular/core';
import { QuestionService } from '@app/services/question/question.service';
import { AlertService } from '@app/services/alert/alert.service';
import { StatisticsService } from '@app/services/statistics/statistics.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor(private _questionService: QuestionService,
              private _statisticsService: StatisticsService,
              private _alertService: AlertService) {
  }

  async ngOnInit(): Promise<void> {
    // Reload questions from BE on every app load (page refresh as well)
    await this._initQuestions();
    await this._initStatistics();
  }

  private async _initQuestions(): Promise<void> {
    try {
      await this._questionService.loadQuestions();
    } catch (e) {
      this._alertService.error(e.message);
    }
  }

  private async _initStatistics(): Promise<void> {
    try {
      await this._statisticsService.loadStatistics();
    } catch (e) {
      this._alertService.error(e.message);
    }
  }
}
