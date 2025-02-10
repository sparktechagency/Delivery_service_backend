import { createClient, RedisClientType } from 'redis';

export class OTPService {
  private redis: RedisClientType;
  private OTP_EXPIRY = 300; // 5 minutes

  constructor() {
    this.redis = createClient();
    this.redis.connect().catch(console.error);

    this.redis.on('error', (err) => console.error('Redis Client Error', err));
    this.redis.on('connect', () => console.log('Redis Client Connected'));
  }

  async generateOTP(phoneNumber: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await this.redis.set(
      `otp:${phoneNumber}`,
      otp,
      {
        EX: this.OTP_EXPIRY
      }
    );
    
    return otp;
  }

  async verifyOTP(phoneNumber: string, otp: string): Promise<boolean> {
    const storedOTP = await this.redis.get(`otp:${phoneNumber}`);
    return storedOTP === otp;
  }

  async cleanup() {
    await this.redis.quit();
  }
}