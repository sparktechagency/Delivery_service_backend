
import { SNSClient, PublishCommand, CreateTopicCommand, SubscribeCommand } from '@aws-sdk/client-sns';
import { formatPhoneNumber } from './formatPhoneNumber'; // Import from the utility file
import winston from 'winston';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

// Validate environment variables
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('AWS credentials are missing in environment variables.');
}

// Create SNS client instance
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || 'eu-north-1', // Default to eu-north-1 if not provided
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Retry mechanism with exponential backoff
const retry = async <T>(fn: () => Promise<T>, retries: number = 3, delay: number = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2); // Exponential backoff
  }
};

// Message customization
const getMessage = (otpCode: string, language: 'en' | 'es' | 'fr' = 'en'): string => {
  const messages = {
    en: `Your OTP is ${otpCode}`,
    es: `Su OTP es ${otpCode}`,
    fr: `Votre OTP est ${otpCode}`,
  };
  return messages[language] || messages.en; // TypeScript now knows `language` is a valid key
};

/**
 * Sends OTP to the specified phone number using AWS SNS
 * @param phoneNumber - Raw phone number to which OTP will be sent
 * @param otpCode - OTP to send
 * @param language - Language for the message (default: 'en')
 * @returns Response from AWS SNS
 */
export const sendOTP = async (
  phoneNumber: string,
  otpCode: string,
  language: 'en' | 'es' | 'fr' = 'en' // Restrict the type here
) => {
  if (!phoneNumber || !otpCode) {
    throw new Error('Phone number and OTP code are required.');
  }

  try {
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
    logger.info(`Formatted phone number: ${formattedPhoneNumber}`);

    const command = new PublishCommand({
      Message: getMessage(otpCode, language), // Now `language` is of the correct type
      PhoneNumber: formattedPhoneNumber,
    });

    const response = await retry(() => snsClient.send(command));
    logger.info('AWS SNS Response:', { response });

    return response;
  } catch (error) {
    logger.error('AWS SNS Error:', { error });
    throw new Error(`Failed to send OTP to ${phoneNumber}: ${error}`);
  }
};

// const createTopic = async (topicName: string) => {
//   try {
//     const command = new CreateTopicCommand({
//       Name: topicName,
//     });

//     const response = await snsClient.send(command);
//     console.log('Topic created:', response.TopicArn);
//     return response.TopicArn; // Return the ARN of the created topic
//   } catch (error) {
//     console.error('Error creating topic:', error);
//     throw error;
//   }
// };

// // Example usage
// (async () => {
//   const topicArn = await createTopic('MyNewTopic');
//   console.log('Topic ARN:', topicArn);
// })();

// const subscribeToTopic = async (topicArn: string, protocol: string, endpoint: string) => {
//   try {
//     const command = new SubscribeCommand({
//       TopicArn: topicArn,
//       Protocol: protocol,
//       Endpoint: endpoint,
//     });

//     const response = await snsClient.send(command);
//     console.log('Subscription ARN:', response.SubscriptionArn);
//     return response.SubscriptionArn;
//   } catch (error) {
//     console.error('Error subscribing to topic:', error);
//     throw error;
//   }
// };

// // Example usage
// (async () => {
//   const topicArn = 'arn:aws:sns:us-east-1:296062584238:ParcelDeliveryApp:7dc69811-0652-42a0-88aa-ac13398f2a3a'; // Replace with your topic ARN
//   const subscriptionArn = await subscribeToTopic(topicArn, 'email', 'example@example.com');
//   console.log('Subscription ARN:', subscriptionArn);
// })();

// const publishMessage = async (topicArn: string, message: string) => {
//   try {
//     const command = new PublishCommand({
//       TopicArn: topicArn,
//       Message: message,
//     });

//     const response = await snsClient.send(command);
//     console.log('Message published:', response.MessageId);
//     return response.MessageId;
//   } catch (error) {
//     console.error('Error publishing message:', error);
//     throw error;
//   }
// };

// // Example usage
// (async () => {
//   const topicArn = 'arn:aws:sns:us-east-1:296062584238:ParcelDeliveryApp'; // Replace with your topic ARN
//   const messageId = await publishMessage(topicArn, 'Hello, this is a test message!');
//   console.log('Message ID:', messageId);
// })();