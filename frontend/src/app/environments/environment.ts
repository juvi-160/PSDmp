// src/environments/environment.ts
export const environment = {
  production: true,
  apiUrl: 'http://localhost:3000/api',
  auth0: {
    domain: 'dev-dmocg784jvwai2hb.us.auth0.com',
    clientId: 'DTt2AVJqmqoNeYOEArqFvn2CmPtt9eKI',
    audience: 'https://dev-dmocg784jvwai2hb.us.auth0.com/api/v2/',
  },
  firebase: {
    apiKey: 'AIzaSyC6__rQOqNeuW2nMJwiBAgXjw‑7Fr6lDb4',
    authDomain: 'psf-membership.firebaseapp.com',
    projectId: 'psf-membership',
    storageBucket: 'psf‑membership.appspot.com',
    messagingSenderId: '447894410735',
    appId: '1:447894410735:web:b915f6ed0963cb6af1521a',
    measurementId: 'G‑6C1FX4YNL3'
  },
  razorpayKeyId: 'rzp_live_JD0PZAEXejiVMZ',
  membershipFee: 100000
};
