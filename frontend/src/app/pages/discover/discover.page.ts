import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { Discover } from '../../services/discover';
import { Auth } from '../../services/auth';
import { environment } from '../../../environments/environment';

@Component({
  standalone: false,
  selector: 'app-discover',
  templateUrl: './discover.page.html',
  styleUrls: ['./discover.page.scss'],
})
export class DiscoverPage implements OnInit {
  suggestions: any[] = [];
  currentIndex = 0;
  loading = true;
  uploadsUrl = environment.uploadsUrl;
  canLike = true;

  zodiacSymbols: Record<string, string> = {
    'Aries':'♈','Tauro':'♉','Géminis':'♊','Cáncer':'♋','Leo':'♌','Virgo':'♍',
    'Libra':'♎','Escorpio':'♏','Sagitario':'♐','Capricornio':'♑','Acuario':'♒','Piscis':'♓'
  };

  swipeStartX = 0;
  swipeCurrentX = 0;
  isDragging = false;
  cardRotation = 0;
  cardTranslateX = 0;

  constructor(
    private discoverService: Discover,
    private auth: Auth,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.auth.state$.subscribe(s => this.canLike = s.canLike);
    this.loadSuggestions();
  }

  loadSuggestions() {
    this.loading = true;
    this.discoverService.getSuggestions().subscribe({
      next: (res) => {
        this.suggestions = res.suggestions || [];
        this.loading = false;
        this.currentIndex = 0;
      },
      error: () => { this.loading = false; }
    });
  }

  get currentProfile() {
    return this.suggestions[this.currentIndex];
  }

  getAge(birthDate: string) {
    if (!birthDate) return null;
    return Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 3600 * 1000));
  }

  getPhotoUrl(profile: any) {
    if (!profile?.profileImage) return null;
    return profile.profileImage.startsWith('http')
      ? profile.profileImage
      : `${this.uploadsUrl}${profile.profileImage}`;
  }

  onTouchStart(e: TouchEvent) {
    this.swipeStartX = e.touches[0].clientX;
    this.isDragging = true;
  }

  onTouchMove(e: TouchEvent) {
    if (!this.isDragging) return;
    this.swipeCurrentX = e.touches[0].clientX;
    const diff = this.swipeCurrentX - this.swipeStartX;
    this.cardTranslateX = diff;
    this.cardRotation = diff * 0.1;
  }

  onTouchEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;
    const diff = this.swipeCurrentX - this.swipeStartX;
    if (diff > 80) this.like();
    else if (diff < -80) this.pass();
    else { this.cardTranslateX = 0; this.cardRotation = 0; }
  }

  like() {
    if (!this.canLike) {
      this.showSubscriptionAlert();
      return;
    }
    const profile = this.currentProfile;
    if (!profile) return;
    this.cardTranslateX = 400;
    this.cardRotation = 20;
    setTimeout(async () => {
      this.discoverService.likeUser(profile.id).subscribe({
        next: async (res) => {
          if (res.isMatch) await this.showMatchToast(profile);
          this.nextProfile();
          this.auth.refreshMe().subscribe();
        },
        error: async (err) => {
          if (err.error?.requiresSubscription || err.error?.requiresUpgrade) {
            this.showSubscriptionAlert();
          }
          this.nextProfile();
        }
      });
    }, 300);
  }

  pass() {
    this.cardTranslateX = -400;
    this.cardRotation = -20;
    setTimeout(() => this.nextProfile(), 300);
  }

  nextProfile() {
    this.cardTranslateX = 0;
    this.cardRotation = 0;
    this.currentIndex++;
    if (this.currentIndex >= this.suggestions.length) {
      this.loadSuggestions();
    }
  }

  private async showMatchToast(profile: any) {
    const toast = await this.toastCtrl.create({
      message: `✨ ¡Es un Match con ${profile.firstName}! Ahora pueden chatear.`,
      duration: 4000,
      position: 'top',
      color: 'secondary',
      buttons: [{ text: 'Ver', handler: () => this.router.navigate(['/matches']) }]
    });
    await toast.present();
  }

  private async showSubscriptionAlert() {
    const alert = await this.alertCtrl.create({
      header: '🌟 Necesitas una suscripción',
      message: 'Agotaste tus likes gratuitos. Suscríbete para seguir conectando con el cosmos.',
      buttons: [
        { text: 'Después', role: 'cancel' },
        { text: 'Ver Planes', handler: () => this.router.navigate(['/plans']) }
      ]
    });
    await alert.present();
  }
}
