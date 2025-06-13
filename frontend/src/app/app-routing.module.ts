import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
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

const routes: Routes = [
  { path: "", component: HomeComponent },
  {
    path: "payment",
    component: PaymentComponent,
    canActivate: [AuthGuard],
  },
  { path: "login", component: LoginComponent },
  { path: "register", component: RegisterComponent },
  { path: "privacy-policy", component: PrivacyPolicyComponent },
  { path: "terms", component: TermsConditionsComponent },
  { path: "refund-policy", component: RefundCancellationComponent },
  { path: "contact", component: ContactUsComponent },
  { path: "forgot-password", component: ForgotPasswordComponent },
  { path: "faqs", component: FaqsComponent },
  

  // { path: "profile", component: ProfileComponent },
  // { path: "events", component: EventsComponent },
    {
      path: 'dashboard',
      component: DashboardComponent,
      children: [
        { path: '', component: DashboardHomeComponent },
        { path: 'event', component: EventsComponent },
        { path: "my-events", component: MyEventsComponent },
        { path: "raise-ticket", component: RaiseTicketComponent },
        { path: "my-tickets", component: MyTicketsComponent },
        { path: 'profile', component: ProfileComponent },
 
        // { path: '', redirectTo: 'home', pathMatch: 'full' }
      ]
    },
    {
      path: "admin",
      component: AdminDashboardComponent,
      children: [
        { path: "", redirectTo: "events", pathMatch: "full" },
        { path: "events", component: EventListComponent },
        { path: "events/add", component: EventFormComponent },
        { path: "events/edit/:id", component: EventFormComponent },
        { path: 'users', component: UserManagementComponent },
        { path: "users/:id", component: UserDetailsComponent },
        { path: "event-rsvps", component: EventRsvpsComponent },
        { path: "tickets", component: TicketManagementComponent },
      ],
    },
    { path: '', redirectTo: 'home', pathMatch: 'full' }
  
  // { path: "reset-password", component: ResetPasswordComponent },
];



@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
