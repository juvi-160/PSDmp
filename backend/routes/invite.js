// import express from 'express';
// import nodemailer from 'nodemailer';
// import { ManagementClient } from 'auth0';

// const router = express.Router();

// // ✅ Auth0 M2M SDK instance
// const auth0 = new ManagementClient({
//   domain: process.env.AUTH_M2M_DOMAIN,
//   clientId: process.env.AUTH_M2M_CLIENT_ID,
//   clientSecret: process.env.AUTH_M2M_CLIENT_SECRET,
//   scope: 'create:users read:users update:users delete:users'
// });

// // 📤 Invite + Create User
// router.post('/send-invite', async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password)
//     return res.status(400).json({ error: 'Email and password are required' });

//   try {
//     await auth0.createUser({
//       connection: process.env.AUTH_M2M_CONNECTION || 'Username-Password-Authentication',
//       email,
//       password,
//       email_verified: false
//     });

//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.SMTP_EMAIL,
//         pass: process.env.SMTP_PASS
//       }
//     });

//     await transporter.sendMail({
//       from: `"PSF Hyderabad" <${process.env.SMTP_EMAIL}>`,
//       to: email,
//       subject: 'You’ve been invited to join PSF!',
//       text: `Hi,

// You’ve been invited to join PSF.

// Login details:
// Email: ${email}
// Password: ${password}

// Visit https://join.psfhyd.org to log in.

// Please change your password after logging in.

// – Team PSF`
//     });

//     res.json({ message: 'Invitation sent successfully!' });
//   } catch (err) {
//     console.error('Invite error →', err.message || err);
//     res.status(err.statusCode || 500).json({ error: err.message || 'Failed to invite user' });
//   }
// });

// // 📋 Get All Users
// router.get('/users', async (req, res) => {
//   try {
//     const users = await auth0.users.getAll();
//     res.json(users);
//   } catch (err) {
//     console.error("Get Users Error →", err?.response?.data || err);
//     res.status(500).json({ error: err.message || 'Failed to fetch users' });
//   }
// });

// // ✏️ Update User Password
// router.patch('/users/:id', async (req, res) => {
//   const { password } = req.body;
//   const { id } = req.params;

//   try {
//     await auth0.updateUser({ id }, { password });
//     res.json({ message: 'Password updated successfully' });
//   } catch (err) {
//     console.error("Update Password Error →", err);
//     res.status(500).json({ error: err.message || 'Failed to update password' });
//   }
// });

// // 🗑️ Delete User
// router.delete('/users/:id', async (req, res) => {
//   const { id } = req.params;

//   try {
//     await auth0.deleteUser({ id });
//     res.json({ message: 'User deleted successfully' });
//   } catch (err) {
//     console.error("Delete User Error →", err);
//     res.status(500).json({ error: err.message || 'Failed to delete user' });
//   }
// });

// // Health check
// router.get('/ping', (req, res) => {
//   res.json({ status: 'Invite API working ✅' });
// });

// export default router;
