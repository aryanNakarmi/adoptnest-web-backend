import app from "./app";
import { PORT } from "./config";
import { connectDatabase } from "./database/mongodb";

async function startServer() {
 await connectDatabase();
 
app.listen(PORT,  '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
 
}
startServer();