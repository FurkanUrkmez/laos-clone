import path from 'path';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes';
import { adminRouter } from './routes/admin.routes';
import { loyaltyRouter } from './routes/loyalty.routes';
import { campaignsRouter } from './routes/campaigns.routes';
import { blogRouter } from './routes/blog.routes';
import { errorHandler } from './middleware/errorHandler';

export const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/loyalty', loyaltyRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/blog', blogRouter);

app.use(errorHandler);
