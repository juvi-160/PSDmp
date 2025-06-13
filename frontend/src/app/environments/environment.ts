// src/environments/environment.ts
export const environment = {
  production: true,
  apiUrl: 'http://localhost:3000/api',
  auth0: {
    domain: 'dev-dmocg784jvwai2hb.us.auth0.com',
    clientId: 'DTt2AVJqmqoNeYOEArqFvn2CmPtt9eKI',
    audience: 'https://dev-dmocg784jvwai2hb.us.auth0.com/api/v2/',
  },
  razorpayKeyId: 'rzp_live_2edq309LjvBSnk',
  membershipFee: 100000, // ₹1000 in paise
};
