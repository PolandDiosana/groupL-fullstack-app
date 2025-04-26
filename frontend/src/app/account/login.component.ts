import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';
import { Subscription } from 'rxjs'; // Add subscription management

import { AccountService, AlertService } from '@app/_services';

@Component({ templateUrl: 'login.component.html' })
export class LoginComponent implements OnInit, OnDestroy {
    form!: UntypedFormGroup;
    loading = false;
    submitted = false;
    private subscription: Subscription = new Subscription(); // Manage subscriptions

    constructor(
        private formBuilder: UntypedFormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
        this.form = this.formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required]
        });
    }

    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;

        // reset alerts on submit
        this.alertService.clear();

        // stop here if form is invalid
        if (this.form.invalid) {
            return;
        }

        this.loading = true;

        // Subscribe to the login observable and handle the response
        const loginSub = this.accountService.login(this.f['email'].value, this.f['password'].value)
            .pipe(first())
            .subscribe({
                next: (account) => {
                    // Check if the account is verified
                    if (!account.isVerified) {
                        this.alertService.warn('Please verify your account before logging in.');
                    }

                    // Get return URL from query parameters or default to home page
                    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
                    this.router.navigate([returnUrl]);
                },
                error: (error) => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });

        // Add the subscription to the subscription collection
        this.subscription.add(loginSub);
    }

    // Unsubscribe when component is destroyed to avoid memory leaks
    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
