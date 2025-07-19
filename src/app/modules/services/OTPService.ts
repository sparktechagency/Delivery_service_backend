import { createClient, RedisClientType } from 'redis';
import bcrypt from 'bcrypt';

export class OTPService {
  private redis: RedisClientType;
  private OTP_EXPIRY = 300; // 5 minutes

  constructor() {
    this.redis = createClient();
    this.redis.connect().catch(console.error);

    this.redis.on('error', (err) => console.error('Redis Client Error', err));
    this.redis.on('connect', () => console.log('Redis Client Connected'));
  }

  async generateOTP(identifier: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = await bcrypt.hash(otp, 10);

    await this.redis.set(`otp:${identifier}`, hashedOTP, { EX: this.OTP_EXPIRY });
    return otp;
  }

  async verifyOTP(identifier: string, otp: string): Promise<boolean> {
    const storedOTP = await this.redis.get(`otp:${identifier}`);

    if (!storedOTP) {
      return false; // Explicitly return false if no OTP is found
    }

    return await bcrypt.compare(otp, storedOTP);
  }

  async cleanup() {
    await this.redis.quit();
  }
}
