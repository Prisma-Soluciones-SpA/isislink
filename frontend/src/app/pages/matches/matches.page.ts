import { Component, OnInit } from '@angular/core';
import { Match } from '../../services/match';
import { environment } from '../../../environments/environment';

@Component({
  standalone: false,
  selector: 'app-matches',
  templateUrl: './matches.page.html',
  styleUrls: ['./matches.page.scss'],
})
export class MatchesPage implements OnInit {
  matches: any[] = [];
  loading = true;
  uploadsUrl = environment.uploadsUrl;

  zodiacSymbols: Record<string, string> = {
    'Aries':'♈','Tauro':'♉','Géminis':'♊','Cáncer':'♋','Leo':'♌','Virgo':'♍',
    'Libra':'♎','Escorpio':'♏','Sagitario':'♐','Capricornio':'♑','Acuario':'♒','Piscis':'♓'
  };

  constructor(private matchService: Match) {}

  ngOnInit() { this.loadMatches(); }
  ionViewWillEnter() { this.loadMatches(); }

  loadMatches() {
    this.loading = true;
    this.matchService.getMatches().subscribe({
      next: (res) => { this.matches = res.matches || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  getPhotoUrl(user: any) {
    if (!user?.profileImage) return null;
    return user.profileImage.startsWith('http') ? user.profileImage : `${this.uploadsUrl}${user.profileImage}`;
  }

  getAge(birthDate: string) {
    if (!birthDate) return null;
    return Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000));
  }
}
