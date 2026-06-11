import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Auth, User } from '../../services/auth';
import { environment } from '../../../environments/environment';

@Component({
  standalone: false,
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  user: User | null = null;
  form: FormGroup;
  profileImagePreview: string | null = null;
  profileImageBlob: Blob | null = null;
  uploadsUrl = environment.uploadsUrl;
  isEditing = false;

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
    private auth: Auth,
    private fb: FormBuilder,
    private router: Router,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    this.form = this.fb.group({
      firstName: [''],
      lastName: [''],
      bio: [''],
      phone: [''],
      city: ['']
    });
  }

  ngOnInit() {
    this.auth.state$.subscribe(state => {
      this.user = state.user;
      if (this.user) {
        this.form.patchValue({
          firstName: this.user.firstName,
          lastName: this.user.lastName,
          bio: this.user.bio || '',
          phone: this.user.phone || '',
          city: this.user.city || ''
        });
        this.selectedPreferences = [...(this.user.esotericPreferences || [])];
      }
    });
    this.auth.refreshMe().subscribe();
  }

  ionViewWillEnter() {
    this.auth.refreshMe().subscribe();
  }

  getProfileUrl() {
    if (!this.user?.profileImage) return null;
    return this.user.profileImage.startsWith('http')
      ? this.user.profileImage
      : `${this.uploadsUrl}${this.user.profileImage}`;
  }

  togglePreference(pref: string) {
    const idx = this.selectedPreferences.indexOf(pref);
    if (idx >= 0) this.selectedPreferences.splice(idx, 1);
    else this.selectedPreferences.push(pref);
  }

  isSelected(pref: string) { return this.selectedPreferences.includes(pref); }

  async changePhoto() {
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

  async saveProfile() {
    const loading = await this.loadingCtrl.create({ message: 'Guardando...', spinner: 'crescent' });
    await loading.present();

    const formData = new FormData();
    const val = this.form.value;
    if (val.firstName) formData.append('firstName', val.firstName);
    if (val.lastName) formData.append('lastName', val.lastName);
    formData.append('bio', val.bio || '');
    if (val.phone) formData.append('phone', val.phone);
    if (val.city) formData.append('city', val.city);
    formData.append('esotericPreferences', JSON.stringify(this.selectedPreferences));
    if (this.profileImageBlob) {
      formData.append('profileImage', this.profileImageBlob, 'profile.jpg');
    }

    this.auth.updateProfile(formData).subscribe({
      next: async () => {
        loading.dismiss();
        this.isEditing = false;
        this.profileImageBlob = null;
        this.profileImagePreview = null;
        const toast = await this.toastCtrl.create({
          message: '✨ Perfil actualizado',
          duration: 2000,
          color: 'success',
          position: 'top'
        });
        await toast.present();
      },
      error: async (err) => {
        loading.dismiss();
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: err.error?.message || 'No se pudo actualizar el perfil',
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  async confirmLogout() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Estás seguro de que quieres salir?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Salir', handler: () => {
          this.auth.logout();
          this.router.navigate(['/login']);
        }}
      ]
    });
    await alert.present();
  }
}
