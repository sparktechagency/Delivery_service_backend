import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './src/DB/database';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

export default app;