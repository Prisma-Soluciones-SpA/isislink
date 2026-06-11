import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TipsPageRoutingModule } from './tips-routing.module';
import { TipsPage } from './tips.page';
import { SharedModule } from '../../components/shared.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, TipsPageRoutingModule, SharedModule],
  declarations: [TipsPage]
})
export class TipsPageModule {}
