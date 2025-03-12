// import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

// const snsClient = new SNSClient({
//   region: "eu-north-1",
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
//   },
// });

// export const sendOTP = async (phoneNumber: string, otpCode: string) => {
//   try {
//     console.log(`Sending OTP to: ${phoneNumber}`); // Debugging

//     const command = new PublishCommand({
//       Message: `Your OTP is ${otpCode}`,
//       PhoneNumber: phoneNumber,
//     });

//     const response = await snsClient.send(command);
//     console.log("AWS SNS Response:", response);
    
//     return response;
//   } catch (error) {
//     console.error("AWS SNS Error:", error);
//     throw new Error("Failed to send OTP via AWS SNS.");
//   }
// };

import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'; // Correct import for v3
import { formatPhoneNumber } from './formatPhoneNumber';  // Import the phone number formatting function

// Create SNS client instance
const snsClient = new SNSClient({
  region: 'eu-north-1', // Replace with your region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Sends OTP to the specified phone number using AWS SNS
 * @param phoneNumber - Raw phone number to which OTP will be sent
 * @param otpCode - OTP to send
 * @returns Response from AWS SNS
 */
export const sendOTP = async (phoneNumber: string, otpCode: string) => {
  try {
    // Ensure the phone number is formatted correctly
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
    console.log(`Formatted phone number: ${formattedPhoneNumber}`); // Debugging

    // Set up PublishCommand for sending OTP
    const command = new PublishCommand({
      Message: `Your OTP is ${otpCode}`,
      PhoneNumber: formattedPhoneNumber,
    });

    // Send OTP via AWS SNS
    const response = await snsClient.send(command);
    console.log('AWS SNS Response:', response);  // Debugging the response

    return response;  // Return the response from SNS
  } catch (error) {
    console.error('AWS SNS Error:', error);  // Log any errors from SNS
    throw new Error('Failed to send OTP via AWS SNS.');
  }
};
