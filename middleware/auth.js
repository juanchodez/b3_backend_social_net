import jwt from "jwt-simple";
import moment from "moment";
import { secret } from "../services/jwt.js";



export const ensureAuth = (req, res, next ) => {
 
    if(!req.headers.authorization) {
        return res.status(403).send({
            status: "error",
            message: "La peticion no tiene la cabecera de autenticacion"
        });
    }  
    
    
    const token = req.headers.authorization.replace(/['"]+/g, '').replace("Bearer ", "");

    try {
        // Decodificar el tokemn
        let payload = jwt.decode(token, secret);
        
        //Comprobar expiracion del token
        if(payload.exp <= moment.unix()) {
            return res.status(401).send({
                status: "error",
                message: "Token expirado"
            });
        }

        req.user = payload;



    } catch (error) {
        return res.status(404).send({
                status: "error",
                message: "Token no válido"
            });
    }

    next();
} 

