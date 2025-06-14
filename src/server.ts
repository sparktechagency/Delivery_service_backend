import app from './app'

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '127.0.0.1';
app.listen(port, host, () => {
    console.log(`✅ Server running at http://${host}:${port}`);
  });


