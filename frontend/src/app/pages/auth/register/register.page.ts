import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoadingController, AlertController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Auth } from '../../../services/auth';
import { Socket } from '../../../services/socket';

@Component({
  standalone: false,
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  step = 1;
  form: FormGroup;
  profileImagePreview: string | null = null;
  profileImageBlob: Blob | null = null;

  zodiacSigns = [
    'Aries','Tauro','Géminis','Cáncer','Leo','Virgo',
    'Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis'
  ];

  zodiacSymbols: Record<string, string> = {
    'Aries':'♈','Tauro':'♉','Géminis':'♊','Cáncer':'♋','Leo':'♌','Virgo':'♍',
    'Libra':'♎','Escorpio':'♏','Sagitario':'♐','Capricornio':'♑','Acuario':'♒','Piscis':'♓'
  };

  esotericOptions = [
    'Tarot','Astrología','Numerología','Cristaloterapia','Meditación',
    'Chakras','Registros Akáshicos','Aura y Energías','Wicca y Magia',
    'Runas','Ángeles y Arcángeles','Quiromancia','Rituales Lunares','Feng Shui'
  ];

  selectedPreferences: string[] = [];

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private socket: Socket,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      gender: ['', Validators.required],
      birthDate: ['', Validators.required],
      phone: [''],
      city: ['', Validators.required],
      bio: ['']
    });
  }

  nextStep() {
    if (this.step === 1 && this.form.get('firstName')?.invalid) return;
    this.step++;
  }

  prevStep() { if (this.step > 1) this.step--; }

  togglePreference(pref: string) {
    const idx = this.selectedPreferences.indexOf(pref);
    if (idx >= 0) this.selectedPreferences.splice(idx, 1);
    else this.selectedPreferences.push(pref);
  }

  isSelected(pref: string) { return this.selectedPreferences.includes(pref); }

  async selectPhoto() {
    if (!Capacitor.isNativePlatform()) {
      this.fileInput.nativeElement.click();
      return;
    }
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt
      });
      this.profileImagePreview = photo.dataUrl || null;
      if (photo.dataUrl) {
        const res = await fetch(photo.dataUrl);
        this.profileImageBlob = await res.blob();
      }
    } catch {}
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.profileImageBlob = file;
    const reader = new FileReader();
    reader.onload = (e) => { this.profileImagePreview = e.target?.result as string; };
    reader.readAsDataURL(file);
  }

  async onRegister() {
    if (this.form.invalid) return;
    const loading = await this.loadingCtrl.create({ message: 'Creando cuenta...', spinner: 'crescent' });
    await loading.present();

    const formData = new FormData();
    const val = this.form.value;
    Object.keys(val).forEach(k => { if (val[k]) formData.append(k, val[k]); });
    formData.append('esotericPreferences', JSON.stringify(this.selectedPreferences));
    if (this.profileImageBlob) {
      formData.append('profileImage', this.profileImageBlob, 'profile.jpg');
    }

    this.auth.register(formData).subscribe({
      next: () => {
        loading.dismiss();
        this.socket.connect();
        const isMale = this.form.value.gender === 'male';
        this.router.navigate([isMale ? '/plans' : '/home'], {
          queryParams: isMale ? { newUser: true } : {}
        });
      },
      error: async (err) => {
        loading.dismiss();
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: err.error?.message || 'Error al registrarse',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }
}
