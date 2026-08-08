import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import clientRoutes from './modules/client/client.routes.js'
import taskRoutes from './modules/task/task.routes.js'
import joinRequestRoutes from './modules/join-request/join-request.routes.js'
import teamRoutes from './modules/team/team.routes.js'
import categoryRoutes from './modules/category/category.routes.js'
import './types/auth'

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health',(_,res)=>{
    res.json({status: 'API is running'});
})

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/join-requests', joinRequestRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/categories', categoryRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT,()=>{
    console.log(`API server is running on port: ${PORT}`)
});
