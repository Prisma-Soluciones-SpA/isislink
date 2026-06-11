import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Subscription } from '../../services/subscription';
import { Auth } from '../../services/auth';
import { Browser } from '@capacitor/browser';

@Component({
  standalone: false,
  selector: 'app-plans',
  templateUrl: './plans.page.html',
  styleUrls: ['./plans.page.scss'],
})
export class PlansPage implements OnInit {
  plans: any = {};
  currentSubscription: any = null;
  isFreemium = false;
  likesRemaining: number | null = null;
  isNewUser = false;
  loading = true;

  planDetails = [
    { key: 'basic', name: 'Básico', icon: '🌙', likes: '50 likes', price: '$3.990', priceNum: 3990, color: '#9333EA', features: ['50 likes por mes', 'Chat ilimitado', 'Ver perfiles completos'] },
    { key: 'medium', name: 'Medio', icon: '⭐', likes: '250 likes', price: '$5.990', priceNum: 5990, color: '#EC4899', features: ['250 likes por mes', 'Chat ilimitado', 'Ver perfiles completos', 'Prioridad en búsquedas'], popular: true },
    { key: 'premium', name: 'Premium', icon: '🌟', likes: 'Ilimitados', price: '$10.990', priceNum: 10990, color: '#F59E0B', features: ['Likes ilimitados', 'Chat ilimitado', 'Perfil destacado', 'Acceso prioritario', 'Soporte premium'] }
  ];

  constructor(
    private subscriptionService: Subscription,
    private auth: Auth,
    private router: Router,
    private route: ActivatedRoute,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.isNewUser = this.route.snapshot.queryParams['newUser'] === 'true';
    const status = this.route.snapshot.queryParams['status'];
    if (status) this.handlePaymentReturn(status);
    this.loadStatus();
  }

  loadStatus() {
    this.loading = true;
    this.subscriptionService.getStatus().subscribe({
      next: (res) => {
        this.currentSubscription = res.subscription;
        this.isFreemium = res.isFreemium || false;
        this.likesRemaining = res.likesRemaining;
        this.loading = false;
        this.auth.refreshMe().subscribe();
      },
      error: () => { this.loading = false; }
    });
  }

  async subscribe(planKey: string) {
    const loading = await this.loadingCtrl.create({ message: 'Iniciando pago...', spinner: 'crescent' });
    await loading.present();

    this.subscriptionService.initTransaction(planKey).subscribe({
      next: async (res) => {
        loading.dismiss();
        await Browser.open({ url: `${res.url}?token_ws=${res.token}` });
      },
      error: async (err) => {
        loading.dismiss();
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: err.error?.message || 'Error al iniciar el pago',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  private async handlePaymentReturn(status: string) {
    const messages: Record<string, any> = {
      success: { header: '✅ Pago exitoso', msg: '¡Tu suscripción está activa! Ahora puedes conectar sin límites.', color: 'success' },
      cancelled: { header: '⚠️ Pago cancelado', msg: 'El proceso de pago fue cancelado.', color: 'warning' },
      failed: { header: '❌ Pago rechazado', msg: 'El pago fue rechazado. Intenta con otro método.', color: 'danger' },
      error: { header: '❌ Error', msg: 'Ocurrió un error inesperado. Contacta soporte.', color: 'danger' }
    };
    const info = messages[status];
    if (info) {
      const toast = await this.toastCtrl.create({
        message: `${info.header}: ${info.msg}`,
        duration: 4000,
        color: info.color,
        position: 'top'
      });
      await toast.present();
    }
    this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }
}
