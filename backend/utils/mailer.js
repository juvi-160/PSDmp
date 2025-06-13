import nodemailer from 'nodemailer';

export const sendWelcomeEmail = async (recipientEmail, recipientName) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS  // App password or real password (use .env)
      }
    });

    const mailOptions = {
      from: `"PSF Membership" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: 'Welcome to PSF!',
      html: `<h2>Hello ${recipientName},</h2><p>Welcome to the PSF community! We're glad to have you on board.</p>`
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${recipientEmail}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
