import dotenv from 'dotenv';
import { createApp } from './app';
import { logger } from './logger';

// quiet: dotenv would otherwise print a plain-text line in the middle of the JSON logs
dotenv.config({ quiet: true });

const PORT = Number(process.env.PORT) || 8080;
const app = createApp();

app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server started');
});

export default app;
