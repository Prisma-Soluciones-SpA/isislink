import { Component, Input, OnInit } from '@angular/core';
import { Auth } from '../../services/auth';

@Component({
  standalone: false,
  selector: 'app-bottom-nav',
  templateUrl: './bottom-nav.component.html',
  styleUrls: ['./bottom-nav.component.scss'],
})
export class BottomNavComponent implements OnInit {
  @Input() active = 'home';

  isMale = false;

  allTabs = [
    { id: 'home', icon: 'home', label: 'Inicio', route: '/home', maleOnly: false },
    { id: 'discover', icon: 'search', label: 'Explorar', route: '/discover', maleOnly: false },
    { id: 'matches', icon: 'heart', label: 'Matches', route: '/matches', maleOnly: false },
    { id: 'tips', icon: 'book', label: 'Tips', route: '/tips', maleOnly: false },
    { id: 'plans', icon: 'card', label: 'Planes', route: '/plans', maleOnly: true }
  ];

  get tabs() {
    return this.allTabs.filter(t => !t.maleOnly || this.isMale);
  }

  constructor(private auth: Auth) {}

  ngOnInit() {
    this.auth.state$.subscribe(state => {
      this.isMale = state.user?.gender === 'male';
    });
  }
}
