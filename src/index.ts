import express, { Application, Request, Response} from 'express';
import bodyParser from 'body-parser';
import { connectDatabase } from './database/mongodb';
import { PORT } from './config';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.route';
import animalReportRoutes from './routes/animalreport.route';
import adminRoutes from './routes/admin.route';
import cors from 'cors';
import path from 'path';

dotenv.config();
//can use .env variable below this
console.log(process.env.PORT);

const app: Application = express();
// const PORT: number = 3000;


const corsOptions = {
    origin:[ 
        'http://localhost:3000', 'http://localhost:3003', 'http://localhost:3005','http://192.168.1.7:5050',
    ],
    optionsSuccessStatus: 200,
    credentials: true,
};
app.use(cors(corsOptions));

app.use(bodyParser.json());

const publicPath = path.join(process.cwd(), 'public');
app.use('/animal_reports', express.static(path.join(publicPath, 'animal_reports')));
app.use('/animal_posts', express.static(path.join(publicPath, 'animal_posts')))
app.use('/profile_pictures', express.static(path.join(publicPath, 'profile_pictures')))
app.use('/animal_posts', express.static(path.join(publicPath, 'animal_posts')));

app.use("/api/v1/auth",authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/reports', animalReportRoutes);


app.get('/', (req:Request, res:Response) =>{
      return res.status(200).json({ success: "true", message: "Welcome to the API" });
});

async function startServer() {
 await connectDatabase();
 
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://${process.env.COMPUTER_IP}:${PORT}`);
});

}
startServer();