import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Chat as ChatService } from '../../services/chat';
import { Match } from '../../services/match';
import { Auth } from '../../services/auth';
import { Socket } from '../../services/socket';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
})
export class ChatPage implements OnInit, OnDestroy {
  @ViewChild('messageList') messageList!: ElementRef;

  matchId = '';
  otherUser: any = null;
  messages: any[] = [];
  newMessage = '';
  currentUserId = '';
  uploadsUrl = environment.uploadsUrl;
  isTyping = false;
  private subs: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private chatService: ChatService,
    private matchService: Match,
    private auth: Auth,
    private socket: Socket
  ) {}

  ngOnInit() {
    this.matchId = this.route.snapshot.paramMap.get('matchId') || '';
    this.currentUserId = this.auth.currentUser?.id || '';
    this.loadMatchData();
    this.loadMessages();
    this.socket.joinChat(this.matchId);
    this.subs.push(
      this.socket.onMessage().subscribe(msg => {
        this.messages.push(msg);
        this.scrollToBottom();
      }),
      this.socket.onTyping().subscribe(data => {
        if (data.userId !== this.currentUserId) this.isTyping = data.isTyping;
      })
    );
  }

  loadMatchData() {
    this.matchService.getMatchById(this.matchId).subscribe({
      next: (res) => { this.otherUser = res.otherUser; }
    });
  }

  loadMessages() {
    this.chatService.getMessages(this.matchId).subscribe({
      next: (res) => {
        this.messages = res.messages || [];
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  sendMessage() {
    const content = this.newMessage.trim();
    if (!content) return;
    this.newMessage = '';
    this.socket.sendMessage(this.matchId, content);
    this.socket.sendTyping(this.matchId, false);
  }

  onTyping() {
    this.socket.sendTyping(this.matchId, this.newMessage.length > 0);
  }

  isMine(msg: any) { return msg.senderId === this.currentUserId; }

  getPhotoUrl(user: any) {
    if (!user?.profileImage) return null;
    return user.profileImage.startsWith('http') ? user.profileImage : `${this.uploadsUrl}${user.profileImage}`;
  }

  private scrollToBottom() {
    try {
      const el = this.messageList?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  ngOnDestroy() {
    this.socket.leaveChat(this.matchId);
    this.subs.forEach(s => s.unsubscribe());
  }
}
