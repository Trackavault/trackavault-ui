import {Component} from '@angular/core';
import {SwUpdate} from '@angular/service-worker';
import {MatSnackBar} from '@angular/material/snack-bar';
import {SnackBarUpdateComponent} from '@src/app/components/snack-bar-update/snack-bar-update.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Trackavault';

  constructor(private serviceWorkerUpdate: SwUpdate,
              private snackBar: MatSnackBar) {
    serviceWorkerUpdate.available.subscribe(value => {
      this.snackBar.openFromComponent(SnackBarUpdateComponent, {
        duration: 0,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    });
  }
}
