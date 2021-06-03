import {Component, OnInit} from '@angular/core';
import {SettingsService} from '@src/app/services/settings/settings.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  numTapped = 0;

  constructor(private settingsService: SettingsService) { }

  ngOnInit(): void {
  }

  onClick(): void {
    this.numTapped += 1;
    if (this.numTapped > 5) {
      this.settingsService.toggleExperimental();
    }
  }
}
