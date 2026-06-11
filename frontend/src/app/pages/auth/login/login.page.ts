import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, AlertController } from '@ionic/angular';
import { Auth } from '../../../services/auth';
import { Socket } from '../../../services/socket';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  form: FormGroup;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private socket: Socket,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    if (this.auth.isLoggedIn) this.router.navigate(['/home']);
  }

  async onLogin() {
    if (this.form.invalid) return;
    const loading = await this.loadingCtrl.create({ message: 'Iniciando sesión...', spinner: 'crescent' });
    await loading.present();

    this.auth.login(this.form.value.email, this.form.value.password).subscribe({
      next: () => {
        loading.dismiss();
        this.socket.connect();
        this.router.navigate(['/home']);
      },
      error: async (err) => {
        loading.dismiss();
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: err.error?.message || 'Error al iniciar sesión',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }
}
