//index.ts 
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

// Type definitions for environment variables
interface EnvVars {
  MONGODB_URI: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_VERIFY_SERVICE_SID: string;
  JWT_SECRET: string;
}


const requiredEnvVars: EnvVars = {
  MONGODB_URI: process.env.MONGODB_URI || '',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_VERIFY_SERVICE_SID: process.env.TWILIO_VERIFY_SERVICE_SID || '',
  JWT_SECRET: process.env.JWT_SECRET || ''
};

// Check for missing environment variables
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export const connectDB = async () => {
  try {
    await mongoose.connect(requiredEnvVars.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};



export const config = {
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',
  twilio: {
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || 'your_twilio_sid',
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || 'your_twilio_auth_token',
    twilioServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID || 'your_twilio_verify_service_sid',
  },
  stripe: {
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET
  },
  email: {
    user: process.env.EMAIL_USER || 'azizulhoq4305@gmail.com',
    password: process.env.EMAIL_PASSWORD || 'igidksaeqbnfqkeh',
  },

};


