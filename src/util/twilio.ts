// // utils/twilio.ts
import twilio from 'twilio';
import { AppError } from "../app/middlewares/error";
import { config } from "../config";

// const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// export const sendOTP = async (to: string, otpCode: string) => {
//   try {
//     const message = await client.messages.create({
//       body: `Your OTP code is: ${otpCode}`,
//       from: process.env.TWILIO_PHONE_NUMBER,
//       to,
//     });
//     console.log('OTP sent:', message.sid);
//   } catch (error) {
//     console.error('Error sending OTP:', error);
//     throw new Error('Failed to send OTP');
//   }
// };

const twilioClient = twilio(config.twilio.twilioAccountSid, config.twilio.twilioAuthToken);
const twilioServiceSid = config.twilio.twilioServiceSid;

// Helper function to send OTP via Twilio
// In your Twilio helper function
const sendTwilioOTP = async (mobileNumber: string): Promise<string> => {
  try {
    console.log(`Attempting to send OTP to: ${mobileNumber}`);
    const verification = await twilioClient.verify.v2
      .services(twilioServiceSid)
      .verifications.create({
        to: mobileNumber,
        channel: 'sms'
      });
    console.log(`OTP sent successfully, SID: ${verification.sid}`);
    return verification.sid;
  } catch (error) {
    console.error(`Failed to send OTP to ${mobileNumber}:`, error);
    throw new AppError('Failed to send OTP', 500);
  }
};
export { sendTwilioOTP, twilioClient, twilioServiceSid };