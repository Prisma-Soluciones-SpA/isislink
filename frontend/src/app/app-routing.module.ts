import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadChildren: () => import('./pages/auth/login/login.module').then(m => m.LoginPageModule) },
  { path: 'register', loadChildren: () => import('./pages/auth/register/register.module').then(m => m.RegisterPageModule) },
  { path: 'home', canActivate: [authGuard], loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule) },
  { path: 'discover', canActivate: [authGuard], loadChildren: () => import('./pages/discover/discover.module').then(m => m.DiscoverPageModule) },
  { path: 'matches', canActivate: [authGuard], loadChildren: () => import('./pages/matches/matches.module').then(m => m.MatchesPageModule) },
  { path: 'chat/:matchId', canActivate: [authGuard], loadChildren: () => import('./pages/chat/chat.module').then(m => m.ChatPageModule) },
  { path: 'tips', canActivate: [authGuard], loadChildren: () => import('./pages/tips/tips.module').then(m => m.TipsPageModule) },
  { path: 'plans', canActivate: [authGuard], loadChildren: () => import('./pages/plans/plans.module').then(m => m.PlansPageModule) },
  { path: 'profile', canActivate: [authGuard], loadChildren: () => import('./pages/profile/profile.module').then(m => m.ProfilePageModule) },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
