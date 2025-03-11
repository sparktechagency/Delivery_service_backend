import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const snsClient = new SNSClient({
  region: "eu-north-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const sendOTP = async (phoneNumber: string, otpCode: string) => {
  try {
    console.log(`Sending OTP to: ${phoneNumber}`); // Debugging

    const command = new PublishCommand({
      Message: `Your OTP is ${otpCode}`,
      PhoneNumber: phoneNumber,
    });

    const response = await snsClient.send(command);
    console.log("AWS SNS Response:", response);
    
    return response;
  } catch (error) {
    console.error("AWS SNS Error:", error);
    throw new Error("Failed to send OTP via AWS SNS.");
  }
};
