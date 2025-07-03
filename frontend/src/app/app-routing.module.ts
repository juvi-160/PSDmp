import { NgModule } from '@angular/core';
import { RouterModule, Routes, UrlSegment } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { HomeComponent } from './auth/home/home.component';
import { ProfileComponent } from './auth/profile/profile.component';
import { EventsComponent } from './dashboard/events/events.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AddEventDialogComponent } from './dashboard/events/add-event-dialog/add-event-dialog.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { EventFormComponent } from './admin/admin-dashboard/events/event-form/event-form.component';
import { EventListComponent } from './admin/admin-dashboard/events/event-list/event-list.component';
import { MyEventsComponent } from './dashboard/my-events/my-events.component';
import { PaymentComponent } from './payment/payment.component';
import { PrivacyPolicyComponent } from './layout/privacy-policy/privacy-policy.component';
import { TermsConditionsComponent } from './layout/terms-conditions/terms-conditions.component';
import { RefundCancellationComponent } from './layout/refund-cancellation/refund-cancellation.component';
import { ContactUsComponent } from './layout/contact-us/contact-us.component';
import { AuthGuard } from './core/guards/auth.guard';
import { UserManagementComponent } from './admin/admin-dashboard/users/user-management/user-management.component';
import { UserDetailsComponent } from './admin/admin-dashboard/users/user-details/user-details.component';
import { EventRsvpsComponent } from './admin/event-rsvps/event-rsvps.component';
import { FaqsComponent } from './layout/faqs/faqs.component';
import { DashboardHomeComponent } from './dashboard/dashboard-home/dashboard-home.component';
import { RaiseTicketComponent } from './dashboard/raise-ticket/raise-ticket.component';
import { MyTicketsComponent } from './dashboard/my-tickets/my-tickets.component';
import { TicketManagementComponent } from './admin/admin-dashboard/ticket-management/ticket-management.component';
import { MembershipSelectionComponent } from './auth/membership-selection/membership-selection.component';
import { InviteComponent } from './admin/admin-dashboard/invite/invite.component';
import { PaymentGuard } from './core/guards/payment.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { PaymentHistoryComponent } from './dashboard/payment-history/payment-history.component';
import { ContributeComponent } from './dashboard/contribute/contribute.component';


const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'membership-selection', component: MembershipSelectionComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'terms', component: TermsConditionsComponent },
  { path: 'refund-policy', component: RefundCancellationComponent },
  { path: 'contact', component: ContactUsComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'faqs', component: FaqsComponent },
  { path: 'payment', component: PaymentComponent, canActivate: [AuthGuard, PaymentGuard] },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: DashboardHomeComponent },
      { path: 'event', component: EventsComponent },
      { path: 'my-events', component: MyEventsComponent },
      { path: 'raise-ticket', component: RaiseTicketComponent },
      { path: 'my-tickets', component: MyTicketsComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'payment-history/:email', component: PaymentHistoryComponent },
      { path: 'contribute', component: ContributeComponent },

      // {
      //   matcher: (segments: UrlSegment[]) => {
      //     if (
      //       segments.length === 4 &&
      //       segments[0].path === 'dashboard' &&
      //       segments[1].path === 'payment-history' &&
      //       segments[2].path === 'users'
      //     ) {
      //       return {
      //         consumed: segments,
      //         posParams: {
      //           userId: segments[3],
      //         },
      //       };
      //     }
      //     return null;
      //   },
      //   component: PaymentHistoryComponent,
      // },
    ],
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard, AdminGuard],
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      { path: 'events', component: EventListComponent },
      { path: 'events/add', component: EventFormComponent },
      { path: 'events/edit/:id', component: EventFormComponent },
      { path: 'users', component: UserManagementComponent },
      { path: 'users/:id', component: UserDetailsComponent },
      { path: 'event-rsvps', component: EventRsvpsComponent },
      { path: 'tickets', component: TicketManagementComponent },
      { path: 'invite', component: InviteComponent },
    ],
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
