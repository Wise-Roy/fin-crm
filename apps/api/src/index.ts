import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import tenantRoutes from './modules/tenant/tenant.routes.js'
import employeeRoutes from './modules/employee/employee.routes.js'
import clientRoutes from './modules/client/client.routes.js'
import taskRoutes from './modules/task/task.routes.js'
import './types/auth'

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health',(_,res)=>{
    res.json({status: 'API is running'});
})

app.use('/api/auth', authRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT,()=>{
    console.log(`API server is running on port: ${PORT}`)
});