import express from 'express';
import cors from 'cors';
import errorMiddleware from './middleware/error.js';
import { authenticateToken } from './middleware/auth.js';
import studentRoutes from './route/student.js';
import classRoutes from './route/class.js';
import companyRoutes from './route/company.js';
import productRoutes from './route/product.js';
import authRoutes from './route/auth.js';
import Mysql from './helpers/mysql.js';

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true, limit: '1024kb'}));
app.use(express.json({ limit: '1024kb' }));
app.use(cors());

// Routes
app.use('/auth', authRoutes);
app.use('/students', studentRoutes);
app.use('/classes', classRoutes);
app.use('/companies', companyRoutes);
app.use('/products', productRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).send({ message: 'BusiCode API is running!', timestamp: new Date().toISOString() });
});

// error handling
app.use(errorMiddleware);

// 404 handler
app.use((req, res) => {
    res.status(404).send({ error: true, message: 'API endpoint not found' });
});

app.on('close', async () => {
    await Mysql.close();
});

app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});

export default app;
