import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Read JSON manually (no import errors)
const serviceAccount = JSON.parse(
  fs.readFileSync(path.resolve('utils/psf-sms-firebase-adminsdk-fbsvc-92d55d129c.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
