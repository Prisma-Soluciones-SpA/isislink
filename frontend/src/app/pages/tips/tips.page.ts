import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Tip } from '../../services/tip';
import { environment } from '../../../environments/environment';

@Component({
  standalone: false,
  selector: 'app-tips',
  templateUrl: './tips.page.html',
  styleUrls: ['./tips.page.scss'],
})
export class TipsPage implements OnInit {
  tips: any[] = [];
  loading = true;
  selectedTip: any = null;
  uploadsUrl = environment.uploadsUrl;

  constructor(private tipService: Tip, private sanitizer: DomSanitizer) {}

  ngOnInit() { this.loadTips(); }

  loadTips() {
    this.loading = true;
    this.tipService.getTips().subscribe({
      next: (res) => { this.tips = res.tips || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  getImageUrl(tip: any) {
    if (!tip?.imageUrl) return null;
    return tip.imageUrl.startsWith('http') ? tip.imageUrl : `${this.uploadsUrl}${tip.imageUrl}`;
  }

  getSafeVideoUrl(tip: any): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(tip.videoUrl);
  }

  openTip(tip: any) { this.selectedTip = tip; }
  closeTip() { this.selectedTip = null; }
}
