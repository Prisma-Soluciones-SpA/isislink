import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { BottomNavComponent } from './bottom-nav/bottom-nav.component';

@NgModule({
  declarations: [BottomNavComponent],
  imports: [CommonModule, IonicModule, RouterModule],
  exports: [BottomNavComponent]
})
export class SharedModule {}
