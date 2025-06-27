// routes/invite.js
import express from 'express';
import axios from 'axios';
import nodemailer from 'nodemailer';

const router = express.Router();

router.post('/send-invite', async (req, res) => {
  const { email } = req.body;

  // Generate a random password
  const password = Math.random().toString(36).slice(-10);

  try {
    // 1. Create user in Auth0
    const auth0Response = await axios.post('http://localhost:3000/api/v2/users', {
      email,
      password,
      connection: 'Username-Password-Authentication',
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.AUTH0_MANAGEMENT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    // 2. Send SMTP email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: `"PSF Hyderabad" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'You’ve been invited to join PSF!',
      text: `Hello,\n\nYou’ve been invited to join PSF.\n\nYour login credentials:\nEmail: ${email}\nPassword: ${password}\n\nVisit: https://join.psfhyd.org to log in.\n\nThanks,\nTeam PSF`
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Invitation sent successfully!' });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to send invite.' });
  }
});



export default router;
