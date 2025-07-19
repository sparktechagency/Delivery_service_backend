import twilio from 'twilio';
import { AppError } from "../app/middlewares/error";
import { config } from "../config";

const twilioClient = twilio(config.twilio.twilioAccountSid, config.twilio.twilioAuthToken);
const twilioServiceSid = config.twilio.twilioServiceSid;

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