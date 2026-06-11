import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { DiscoverPageRoutingModule } from './discover-routing.module';
import { DiscoverPage } from './discover.page';
import { SharedModule } from '../../components/shared.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, DiscoverPageRoutingModule, SharedModule],
  declarations: [DiscoverPage]
})
export class DiscoverPageModule {}
