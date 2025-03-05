import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,   
  port: Number(process.env.SMTP_PORT),
  secure: false,              
  auth: {
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS, 
  },
  
});



const sendEmail = async (values: any) => {
  try {
    const info = await transporter.sendMail({
      from: `"Parcel Delivery App" <${process.env.SMTP_USER}>`,  // Ensure the correct format here
      to: values.to,
      subject: values.subject,
      html: values.html,
    });
    
    console.log('Mail sent successfully', info.accepted);
  } catch (error) {
    console.log('Email Error:', error);
  }
};

export const emailHelper = {
  sendEmail,
};
