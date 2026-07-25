import express from 'express'
import cors from 'cors'

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health',(_,res)=>{
    res.json({status: 'API is running'});
})

const PORT = process.env.PORT || 8000;
app.listen(PORT,()=>{
    console.log(`API server is running on port: ${PORT}`)
});