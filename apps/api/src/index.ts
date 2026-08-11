import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import clientRoutes from './modules/client/client.routes.js'
import taskRoutes from './modules/task/task.routes.js'
import teamRoutes from './modules/team/team.routes.js'
import categoryRoutes from './modules/category/category.routes.js'
import paymentRoutes from './modules/payment/payment.routes.js'
import reimbursementRoutes from './modules/reimbursement/reimbursement.routes.js'
import dscRoutes from './modules/dsc/dsc.routes.js'
import configRoutes from './modules/tenant/tenant-config.routes.js'
import './types/auth'

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get('/api/health',(_,res)=>{
    res.json({status: 'API is running'});
})

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reimbursements', reimbursementRoutes);
app.use('/api/dsc', dscRoutes);
app.use('/api/config', configRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT,()=>{
    console.log(`API server is running on port: ${PORT}`)
});
