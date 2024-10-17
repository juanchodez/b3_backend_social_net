
import User from "../models/users.js"

export const testUser = (req, res) => {
  let params = req.body;
  let user_to_save =  new User(params);
  
  return res.status(200).send({
      message: "Mensaje enviado desde el controlador de Usuarios",
      user_to_save
    });
  };


export const register = async (req, res) => {
  try {
    //Obtener datos
    let params = req.body;

    //Validar datos los que son obligatorios y existan
    if(!params.name || !params.last_name || !params.nick || !params.email || !params.password){
      return res.status(400).json({
        status: "error",
        message: "faltan datos por enviar"
      });
      
    }
      
      // crear un objeto con los usuarios que validamos
      let user_to_save =  new User(params);

      //Guardar datos en la base de datos
      await user_to_save.save();

       // Devolver usuario
      return res.status(200).json({
        message: "Registro de usuario exitoso",
        params,
        user_to_save
      });

    //Control de usuarios duplicados

  } catch (error) {
    console.log("Error en el registro de usuario", error);
      return res.status(500).send({
        status: "Error",
        message: "Registro de usuario"
  })
};
}