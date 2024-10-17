import dotenv from "dotenv";
import express from "express";
import connection from "./database/connection.js";
import cors from "cors";
import bodyParser from "body-parser";
import UserRoutes from "./routes/users.js";
import PublicationRoutes from "./routes/publications.js";
import FollowRoutes from "./routes/follows.js";

dotenv.config();

console.log("API node en ejecucion");


connection();


const app = express();
const puerto = process.env.PORT || 3900;

app.use(cors({
    origin: '*',
    methods: 'GET,PUT,HEAD,PATCH,POST,DELETE',
    preflightContinue: false,
    optionSuccessSatus: 204
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use('/api/user', UserRoutes);
app.use('/api/publication', PublicationRoutes);
app.use('/api/follow', FollowRoutes);

app.listen(puerto, () => {
    console.log("Servidor de node ejecutandose en el puerto", puerto);
});


export default app;
