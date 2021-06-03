import {Component, OnInit} from '@angular/core';
import {MatSnackBarRef} from '@angular/material/snack-bar';

@Component({
  selector: 'app-snack-bar-update',
  templateUrl: './snack-bar-update.component.html',
  styleUrls: ['./snack-bar-update.component.css']
})
export class SnackBarUpdateComponent implements OnInit {

  constructor(public snackBarRef: MatSnackBarRef<SnackBarUpdateComponent>,) { }

  ngOnInit(): void {
  }

  refresh(): void {
    window.location.reload();
  }

  cancel(): void {
    this.snackBarRef.dismiss();
  }
}
