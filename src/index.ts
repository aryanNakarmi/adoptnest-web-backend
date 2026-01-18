import express, { Application, Request, Response} from 'express';
import bodyParser from 'body-parser';
import { connectDatabase } from './database/mongodb';
import { PORT } from './config';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.route';

dotenv.config();
//can use .env variable below this
console.log(process.env.PORT);

const app: Application = express();
// const PORT: number = 3000;

app.use(bodyParser.json());

app.use("/api/v1/auth",authRoutes);

app.get('/', (req:Request, res:Response) =>{
      return res.status(200).json({ success: "true", message: "Welcome to the API" });
});

async function startServer() {
 await connectDatabase();
 
 app.listen(PORT,() => {
     console.log(`Server :http://localhost:${PORT}`);
 }
);
}
startServer();