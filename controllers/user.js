
import User from "../models/users.js";
import Follow from "../models/follows.js";
import Publication from "../models/publications.js";
import bcrypt from "bcrypt";
import { createToken } from "../services/jwt.js";
import { followThisUser, followUserIds } from "../services/followServices.js";


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

      //Control de usuarios duplicados

      const existingUser = await User.findOne({
        $or: [
          { email: user_to_save.email.toLowerCase() },
          { nick: user_to_save.nick.toLowerCase() }
        ]
      });

      if (existingUser) {
        return res.status(409).send({
          status: "success",
          message: "El usuario ya existe"

        })
      }

      //Cifrar contraseña
      const hop = await bcrypt.genSalt(10);

      const hashedPassword = await bcrypt.hash(user_to_save.password, hop );

      user_to_save.password = hashedPassword;

      //Guardar datos en la base de datos
      await user_to_save.save();

       // Devolver usuario
      return res.status(200).json({
        message: "Registro de usuario exitoso",
        params,
        user_to_save
      });

  

  } catch (error) {
    console.log("Error en el registro de usuario", error);
      return res.status(500).send({
        status: "Error",
        message: "Registro de usuario"
  })
};
};

// Método de Login (usar JWT)
export const login = async (req, res) => {
  try {

    // Obtener los parámetros del body (enviados en la petición)
    let params = req.body;

    // Validar que si recibimos el email y el password
    if (!params.email || !params.password) {
      return res.status(400).send({
        status: "error",
        message: "Faltan datos por enviar email o password"
      });
    }

    // Buscar en la BD si existe el email registrado
    const userBD = await User.findOne({ email: params.email.toLowerCase() });

    // Si no existe el usuario buscado
    if (!userBD) {
      return res.status(404).send({
        status: "error",
        message: "Usuario no encontrado"
      });
    }

    // Comprobar su contraseña
    const validPassword = await bcrypt.compare(params.password, userBD.password);

    // Si la contraseña es incorrecta (false)
    if (!validPassword) {
      return res.status(401).send({
        status: "error",
        message: "Contraseña incorrecta"
      });
    }

    // Generar token de autenticación (JWT)
    const token = createToken(userBD);

    // Devolver respuesta de login exitoso
    return res.status(200).json({
      status: "success",
      message: "Autenticaciónv exitosa",
      token,
      userBD: {
        id: userBD._id,
        name: userBD.name,
        last_name: userBD.last_name,
        email: userBD.email,
        nick: userBD.nick,
        image: userBD.image
      }
    });

  } catch (error) {
    console.log("Error en la autenticación del usuario: ", error);
    // Devolver mensaje de error
    return res.status(500).send({
      status: "error",
      message: "Error en la autenticación del usuario"
    });
  }
};

export const profile = async (req,res) => {
  try {
    
    const userId = req.params.id;

    if(!req.user || !req.user.userId){
      return res.status(401).send({
        status: "error",
        message: "Usuario no autenticado"
      });
    }

    const userProfile = await User.findById(userId).select('-password -role -email -__v');
    
    if(!userProfile){
      return res.status(401).send({
        status: "error",
        message: "Usuario no encontrado" 
      }); 
    }

    //Informacion de seguimiento
    const followInfo = await followThisUser(req.user.userId, userId);

    return res.status(200).json({
      status:"sucess",
      user: userProfile,
      followInfo
    })

  } catch (error) {
    console.log("Error al obtener el perfil del usuario: ", error);

    return res.status(500).send({
      status: "error",
      message: "Error al obtener el perfil del usuario"
    })
    
  }
}


export const listUsers = async (req,res) => {
  try {

    let page = req.params.page ? parseInt(req.params.page, 10) : 1;

    let itemsPerPage = req.query.limit ? parseInt(req.query.limit, 10) : 4;

    const options = {
      page: page,
      limit: itemsPerPage,
      select: '-password -email -role -__v'
    }

    const users = await User.paginate({}, options);

    if(!users || users.docs.lenght === 0){
      return res.status(404).send({
        status: "error",
        message: "No existen usuarios disponibles"
      })
    }

    //listar los seguidores de un usuario, obtener un array
    let followUsers = await followUserIds(req);

    //Devolver

    return res.status(200).json({
      status: "success",
      users: users.docs,
      totalDocs: users.totalDocs,
      totalPages: users.totalPages,
      totalPages: users.page,
      users_following: followUsers.following,
      user_follow_me: followUsers.followers
    });
    
  } catch (error) {
    console.log("Error listar usuarios: ", error);
      return res.status(500).send({
        status: "Error",
        message: "Error al lista r usuarios"
  });
}
}

// Método para actualizar los datos del usuario
export const updateUser = async (req, res) => {
  try {

    let userIdentity = req.user;
    let userToUpdate = req.body;

    delete userToUpdate.iat;
    delete userToUpdate.exp;
    delete userToUpdate.role;

    const users = await User.find({
      $or: [
        { email: userToUpdate.email},
        { nick: userToUpdate.nick }
      ]
    }).exec();
    
    const isDuplicateUser = users.some(user => {
      return user && user._id.toString() !== userIdentity.userId;
    });

    if(isDuplicateUser){
      return res.status(400).send({
        status: "Error",
        message: "Solo se puede actualizar el usuario logeado "
      });
    }

    if(userToUpdate.password){
      try {
        let pwd = await bcrypt.hash(userToUpdate.password, 10);
        userToUpdate.password = pwd;
      } catch (error) {
        return res.status(500).send({
          status: "error",
          message: "Error al cifrar contraseña"
      });
    }
    } else {
      delete userToUpdate.password;
    }

    let userUpdated = await User.findByIdAndUpdate(userIdentity.userId, userToUpdate, {new: true});

    if(!userUpdated){
      return res.status(400).send({
        status:"Error",
        message: "Error al actualizar el usuario"
      })
    }

    return res.status(200).json({
      status: "success",
      message: "Método para actualizar usuario",
      user: userUpdated
    });
  } catch (error) {
    console.log("Error al actualizar los datos del usuario: ", error);
    return res.status(500).send({
      status: "error",
      message: "Error al actualizar los datos del usuario"
    });
  }
}


export const uploadAvatar = async (req, res) => {
  try {
    if(!req.file){
      return res.status(400).send({
        status: "error",
        message: "Error la petición no incluye la imagen"
      });
    }

    const avatarUrl = req.file.path;

    // Guardar la imagen en la BD
    const userUpdated = await User.findByIdAndUpdate(
      req.user.userId,
      { image: avatarUrl },
      { new: true }
    );


    if(!userUpdated){
      return res.status(500).send({
        status: "error",
        message: "Error al subir el archivo del avatar"
      });
      
    }

    return res.status(200).json({
      status: "success",
      user: userUpdated,
      file: avatarUrl
    });

  } catch (error) {
    console.log("Error al subir el archivo del avatar", error);
    return res.status(500).send({
      status: "error",
      message: "Error al subir el archivo del avatar"
    });
    
  }
}

export const avatar = async (req, res) => {
  try {
    //Obtener el parametro desde la URL
    const userId = req.params.id;

    const user = await User.findById(userId).select('image');

    if(!user || !user.image){
      return res.status(404).send({
        status: "error",
        message: "No existe usuario o imagen"
      });
    }
    //Devolver URL de la imagen
    return res.status(200).send({
      status: "success",
      imageUrl: user.image
    });

        // Redirigir a la URL de la imagen en Cloudinary
        return res.redirect(user.image);

  } catch (error) {
    console.log("Error al mostrar el archivo del avatar", error);
    return res.status(500).send({
      status: "error",
      message: "Error al mostrar el archivo del avatar"
    });
  }
}

export const counters = async (req, res) => {
  try {
    // Obtener el Id del usuario autenticado (token)
    let userId = req.user.userId;


    // Si llega el id a través de los parámetros en la URL tiene prioridad
    if(req.params.id){
      userId = req.params.id;
    }

    // Obtener el nombre y apellido del usuario
    const user = await User.findById(userId, { name: 1, last_name: 1});



    // Vericar el user
    if(!user){
      return res.status(404).send({
        status: "error",
        message: "Usuario no encontrado"
      });
    }

    // Contador de usuarios que yo sigo (o que sigue el usuario autenticado)
    const followingCount = await Follow.countDocuments({ "following_user": userId });

    // Contador de usuarios que me siguen a mi (que siguen al usuario autenticado)
    const followedCount = await Follow.countDocuments({ "followed_user": userId });

    // Contador de publicaciones del usuario autenticado
    const publicationsCount = await Publication.countDocuments({ "user_id": userId });

    // Devolver los contadores
    return res.status(200).json({
      status: "success",
      userId,
      name: user.name,
      last_name: user.last_name,
      followingCount: followingCount,
      followedCount: followedCount,
      publicationsCount: publicationsCount
    });

  } catch (error) {
    console.log("Error en los contadores", error)
    return res.status(500).send({
      status: "error",
      message: "Error en los contadores"
    });
  }
}