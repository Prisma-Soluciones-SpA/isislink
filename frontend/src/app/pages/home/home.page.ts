import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, User } from '../../services/auth';
import { Match } from '../../services/match';
import { Subscription } from '../../services/subscription';
import { environment } from '../../../environments/environment';

@Component({
  standalone: false,
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  user: User | null = null;
  matchCount = 0;
  subscription: any = null;
  canLike = true;
  likesRemaining: number | null = null;
  uploadsUrl = environment.uploadsUrl;

  zodiacSymbols: Record<string, string> = {
    'Aries':'♈','Tauro':'♉','Géminis':'♊','Cáncer':'♋','Leo':'♌','Virgo':'♍',
    'Libra':'♎','Escorpio':'♏','Sagitario':'♐','Capricornio':'♑','Acuario':'♒','Piscis':'♓'
  };

  constructor(
    private auth: Auth,
    private matchService: Match,
    private subscriptionService: Subscription,
    public router: Router
  ) {}

  ngOnInit() {
    this.auth.state$.subscribe(state => {
      this.user = state.user;
      this.subscription = state.subscription;
      this.canLike = state.canLike;
      this.likesRemaining = state.likesRemaining;
    });
    this.loadMatches();
  }

  ionViewWillEnter() {
    this.auth.refreshMe().subscribe();
    this.loadMatches();
  }

  loadMatches() {
    this.matchService.getMatches().subscribe({
      next: (res) => this.matchCount = res.matches?.length || 0,
      error: () => {}
    });
  }

  getProfileUrl() {
    if (!this.user?.profileImage) return null;
    return this.user.profileImage.startsWith('http')
      ? this.user.profileImage
      : `${this.uploadsUrl}${this.user.profileImage}`;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
