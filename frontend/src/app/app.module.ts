import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Angular Material Modules
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthModule } from '@auth0/auth0-angular';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from "@angular/material/select";
import { MatTabsModule } from "@angular/material/tabs";
import { MatMenuModule } from "@angular/material/menu";
import { MatDividerModule } from "@angular/material/divider";
import { MatChipsModule } from "@angular/material/chips";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatRadioModule } from "@angular/material/radio";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatExpansionModule } from '@angular/material/expansion';

// Components
import { AppComponent } from './app.component';
import { RegisterComponent } from './auth/register/register.component';
import { HomeComponent } from './auth/home/home.component';
import { LoginComponent } from './auth/login/login.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ProfileComponent } from './auth/profile/profile.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { EventsComponent } from './dashboard/events/events.component';
import { AddEventDialogComponent } from './dashboard/events/add-event-dialog/add-event-dialog.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { EventListComponent } from './admin/admin-dashboard/events/event-list/event-list.component';
import { EventFormComponent } from './admin/admin-dashboard/events/event-form/event-form.component';
import { ConfirmDialogComponent } from './admin/admin-dashboard/shared/confirm-dialog/confirm-dialog.component';
import { MyEventsComponent } from './dashboard/my-events/my-events.component';
import { FeedbackDialogComponent } from './dashboard/my-events/feedback-dialog/feedback-dialog.component';
import { PaymentComponent } from './payment/payment.component';
import { environment } from './environments/environment';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { FooterComponent } from './layout/footer/footer.component';
import { PrivacyPolicyComponent } from './layout/privacy-policy/privacy-policy.component';
import { TermsConditionsComponent } from './layout/terms-conditions/terms-conditions.component';
import { RefundCancellationComponent } from './layout/refund-cancellation/refund-cancellation.component';
import { ContactUsComponent } from './layout/contact-us/contact-us.component';
import { UserManagementComponent } from './admin/admin-dashboard/users/user-management/user-management.component';
import { UserDetailsComponent } from './admin/admin-dashboard/users/user-details/user-details.component';
import { FaqsComponent } from './layout/faqs/faqs.component';
import { UserEditDialogComponent } from './admin/admin-dashboard/users/user-edit-dialog/user-edit-dialog.component';
import { DashboardHomeComponent } from './dashboard/dashboard-home/dashboard-home.component';
import { RaiseTicketComponent } from './dashboard/raise-ticket/raise-ticket.component';
import { MyTicketsComponent } from './dashboard/my-tickets/my-tickets.component';
import { TicketManagementComponent } from './admin/admin-dashboard/ticket-management/ticket-management.component';
import { MemberComponent } from './auth/member/member.component';
import { MembershipSelectionComponent } from './auth/membership-selection/membership-selection.component';


import { InviteComponent } from './admin/admin-dashboard/invite/invite.component';
import { AdminGuard } from './core/guards/admin.guard';
import { PaymentHistoryComponent } from './dashboard/payment-history/payment-history.component';
import { ContributeComponent } from './dashboard/contribute/contribute.component';
import { ToastComponent } from './layout/toast/toast.component';

import { EventRsvpsComponent } from './admin/event-rsvps/event-rsvps.component';
import { TicketDetailsComponent } from './admin/admin-dashboard/ticket-management/ticket-details/ticket-details.component';
import { FeedbackComponent } from './admin/admin-dashboard/feedback/feedback.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'membership-selection', component: MembershipSelectionComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: "privacy-policy", component: PrivacyPolicyComponent },
  { path: "terms", component: TermsConditionsComponent },
  { path: "refund-policy", component: RefundCancellationComponent },
  { path: "contact", component: ContactUsComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'faqs', component: FaqsComponent },
  { path: "payment", component: PaymentComponent },
  { path: 'toast', component: ToastComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      { path: '', component: DashboardHomeComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'event', component: EventsComponent },
      { path: "my-events", component: MyEventsComponent },
      { path: "raise-ticket", component: RaiseTicketComponent },
      { path: "my-tickets", component: MyTicketsComponent },
      { path: 'payment-history/:email', component: PaymentHistoryComponent },
      { path: 'contribute', component: ContributeComponent },
    ]
  },
  {
    path: "admin",
    component: AdminDashboardComponent,
    children: [
      { path: "", redirectTo: "users", pathMatch: "full" },
      { path: "events", component: EventListComponent },
      { path: "events/add", component: EventFormComponent },
      { path: "events/edit/:id", component: EventFormComponent },
      { path: 'users', component: UserManagementComponent },
      { path: "users/:id", component: UserDetailsComponent },
      { path: "event-rsvps", component: EventRsvpsComponent },
      { path: "tickets", component: TicketManagementComponent },
      { path: 'tickets/:id', component: TicketDetailsComponent },
      { path: "invite", component: InviteComponent },
      { path: "feedback", component: FeedbackComponent },
    ]
  }
];

@NgModule({
  declarations: [
    AppComponent,
    RegisterComponent,
    HomeComponent,
    LoginComponent,
    ForgotPasswordComponent,
    ProfileComponent,
    DashboardComponent,
    EventsComponent,
    AddEventDialogComponent,
    AdminDashboardComponent,
    EventListComponent,
    EventFormComponent,
    ConfirmDialogComponent,
    MyEventsComponent,
    FeedbackDialogComponent,
    PaymentComponent,
    NavbarComponent,
    FooterComponent,
    PrivacyPolicyComponent,
    TermsConditionsComponent,
    RefundCancellationComponent,
    ContactUsComponent,
    UserManagementComponent,
    UserDetailsComponent,
    FaqsComponent,
    UserEditDialogComponent,
    DashboardHomeComponent,
    RaiseTicketComponent,
    MyTicketsComponent,
    TicketManagementComponent,
    EventRsvpsComponent,
    TicketDetailsComponent,

    MembershipSelectionComponent,
    MemberComponent,
    InviteComponent,
    MemberComponent,
    PaymentHistoryComponent,
    ContributeComponent,
    ToastComponent,
    TicketDetailsComponent,
    FeedbackComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forRoot(routes),
    BrowserAnimationsModule,
    MatExpansionModule,
    AuthModule.forRoot({
      domain: environment.auth0.domain,
      clientId: environment.auth0.clientId,
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: environment.auth0.audience
      }
    }),
    // Angular Material Modules
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatDialogModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatSelectModule,
    MatTabsModule,
    MatMenuModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatRadioModule,
    MatAutocompleteModule,
    MatSlideToggleModule,
    MatTooltipModule
  ],
  providers: [
    provideHttpClient(),
    AdminGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
