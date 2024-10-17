
import { connect } from "mongoose";
import dotenv from "dotenv";

//configuracion para usar variables de entorno
dotenv.config();

const connection = async() => {
    try {
        await connect(process.env.MONGODB_URI);
        console.log("Conectado correctamente a la BD");
    } catch (error) {
        console.log("Error al conectar la base de datos", error);
        throw new Error("NO se ha podido conectar a la BD");
    }
}

export default connection;