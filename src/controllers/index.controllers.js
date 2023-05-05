const { Pool } = require('pg');
const { json, response } = require('express');
const multer = require('multer');


function middleware(req,res,next){
    const token = req.headers['token'];
    const dotenv = require('dotenv').config({ path: 'pass.env' });
    const secretKey = process.env.secretkey;
    const jwt = require('jsonwebtoken');
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).send(false);
        } else {
          req.id_usuario = decoded.data;
          next();
        }
    });
}

const pool = new Pool({
    host: 'ec2-107-23-75-98.compute-1.amazonaws.com',
    user: 'postgres',
    password: 'vegie12',
    database: 'postgres',
    port: '5432'
})

const storage = multer.diskStorage({
    filename: async function (res, file, cb) {
      let query = await pool.query('select MAX(id_preparacion) from preparaciones')
      let id = query.rows[0];
      let extension = file.originalname.split(".")[1];
      const fileName = id.max + "." + extension;
      cb(null, `${fileName}`);
    },
    destination: function (res, file, cb) {
        cb(null, './public/');
    },
});

const upload = multer({ storage });


//Se obtienen todos los productos enconjunto a su favoritos del usuario logeado
const obtenerTodosProductos = async(req, res) => {
    let {id_usuario} = req.id_usuario;
    let obtenerProductos = await pool.query('select p.id_producto,p.nombre,marcas.nombre as marca,nutricional.kcal_100,es_producto_favorito($1,p.id_producto) from usuarios u join productos_favoritos pf on pf.id_usuario = u.id_usuario right join productos p on p.id_producto = pf.id_producto join nutricional ON p.nutricional = nutricional.id_nutricional join marcas on p.marca = marcas.id_marca',[id_usuario]);
    pool.end;
    return res.send(obtenerProductos.rows);
}


//Se recibe el id del producto atraves del parametro del EndPoint
const obtenerinformacionNutricionalProductoSimple = async(req, res) => {
    let idProducto = req.params.id;
    let obtenerProductos = await pool.query(`select p.id_producto,p.nombre,p.porcion,p.cantidad_embase ,n.* 
                                                from productos p join nutricional n on n.id_nutricional = p.nutricional 
                                                where id_producto = $1;`,[idProducto])
    pool.end;
    return res.send(obtenerProductos.rows);
}

//Se recibe un objeto JSON por el metodo POST, el cual recibe: id_usuario, fecha, unidad_medida, id_producto, cantidad, checked.
const generarPlanProducto = async(req, res) => {
    try{
        let {id_usuario} = req.id_usuario;
        let {fecha, unidad_medida, id_producto, cantidad, checked,momento_dia} = req.body;
        let generarPlan = await pool.query('insert into planes_productos(id_usuario,fecha,id_producto,unidad_medida,cantidad,checked,momento_dia) values($1,$2,$3,$4,$5,$6,$7)',[id_usuario,fecha,id_producto,unidad_medida,cantidad,checked,momento_dia]);
        if(generarPlan){
            return res.status(200).send(true);
        }
    }
    catch(err){
        console.log(err)
        return res.status(500).send(false)
    }
}

const obtenerUnidadesMedida = async(req,res) => {
    try{
        let id_producto = req.body.id_producto
        let unidades = await pool.query(`select um.* from unidades_medida um 
                                            join productos_unidades pu on pu.id_unidad = um.id_unidad_medida 
                                            where pu.id_producto = $1`,[id_producto])
        return res.status(200).send(unidades.rows)
    }
    catch(err){
        console.log(err)
        return res.status(500).send(false)
    }
 }

const obtenerPlanAlimentacion = async(req,res) => {
    try{
        let {id_usuario} = req.id_usuario
        let fecha = req.body.fecha
        let plan_producto = await pool.query(`select pp.*,p.nombre, case when pp.unidad_medida = 1 
                                                                then pp.cantidad*n.kcal_prcn
                                                                else pp.cantidad*n.kcal_100/100
                                                            end kcal
                                    from planes_productos pp 
                                    join productos p on pp.id_producto = p.id_producto 
                                    join nutricional n on p.nutricional = n.id_nutricional 
                                    where pp.fecha=$1 and pp.id_usuario=$2`,[fecha,id_usuario])
        let plan = {
            productos: plan_producto.rows
        }
        return res.status(200).send(plan)
    }
    catch(err){
        console.log(err)
        return res.status(500).send(false)
    }
}

const marcarCheckedPlanProducto = async(req,res) => {
    try{
        let {id_usuario} = req.id_usuario
        let {id_plan_producto,checked} = req.body
        await pool.query(`update planes_productos 
                            set checked = $1 
                            where id_usuario = $2
                            and id_plan_producto = $3`,[checked,id_usuario,id_plan_producto])
       
        let is_checked = await pool.query(`select checked from planes_productos
                    where id_usuario=$1 
                    and id_plan_producto=$2`,[id_usuario,id_plan_producto])
        
        return res.status(200).send({checked:is_checked.rows[0].checked})
    }
    catch(err){
        console.log(err)
        return res.status(500).send(false)
    }
}

const obtenerListaProductosSimilitudes = async(req,res) =>{
    let {id_usuario} = req.id_usuario;
    let nombre = req.params.busqueda;
    let responseQuery = await pool.query('select * from buscar_producto_logeado($1,$2)',[nombre,id_usuario]);
    pool.end;
    return res.status(200).send(responseQuery.rows);
}

const registrarUsuario = async(req,res) => {
    let {email,nombre,password,fecha_nacimiento,peso,altura,sexo,objetivo,tarjet_calorias,es_vegano} = req.body;
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    let auxContraseña =  bcrypt.hashSync(password, saltRounds, (err, hash) => {
        if (err) throw (err)
        contraseña = hash;
    });
    let response = await pool.query('select email from usuarios where email = $1',[email]);
    if(response.rows.length == 0){
        let responseQuery = await pool.query('INSERT INTO usuarios(nombre, email, password, fecha_nacimiento, peso, altura, sexo, objetivo, tarjet_calorias, es_vegano) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[nombre,email,auxContraseña,fecha_nacimiento,peso,altura,sexo,objetivo,tarjet_calorias,es_vegano]);
        return res.status(200).send(true);
    }else{
        return res.status(401).send(false);
    }
}

const loginUsuario = async (req,res) => {
    const dotenv = require('dotenv').config({ path: 'pass.env' });
    const {email,password} = req.body;
    const response = await pool.query('select id_usuario,password from usuarios where email = $1',[email]);
    const bcrypt = require('bcrypt');
    const jwt = require('jsonwebtoken');
    if(response.rowCount > 0 && bcrypt.compareSync(password, response.rows[0].password)){
        let resultado = response.rows[0];
        delete resultado.password;
        let token = jwt.sign({
            data: resultado
        }, process.env.secretkey , { expiresIn: 60 * 60 * 24}) // duracion de 1 dia.
        pool.end;
        return res.json({
            token,
            valor: true
        })
    }else{
        pool.end;
        res.status(401).send(false);
    }
}
 
const agregarProductoAFavoritos = async (req,res) =>{
    let {id_usuario} = req.id_usuario;
    let idProducto = req.params.idProducto;
    try{
        let response = await pool.query('INSERT INTO productos_favoritos (id_usuario, id_producto) VALUES($1, $2);', [id_usuario,idProducto]);
        return res.status(200).send(true);
    }catch(err){
        return res.status(200).send(false)
    }
}

const quitarProductoAFavoritos = async (req,res) =>{
    let {id_usuario} = req.id_usuario;
    let idProducto = req.params.idProducto;
    try{
        let response = await pool.query('DELETE FROM productos_favoritos WHERE id_usuario = $1 AND id_producto= $2;', [id_usuario,idProducto]);
        return res.status(200).send(true);
    }catch(err){
        return res.status(200).send(false);
    }
}

const obtenerTodasRecetas = async (req,res) =>{
    let {id_usuario} = req.id_usuario;
    let obtenerReceta = await pool.query('select p.nombre, n.kcal_prcn, p.link_imagen, es_preparacion_favorita($1,p.id_preparacion) from preparaciones p join nutricional n on p.nutricional = n.id_nutricional',[id_usuario]);
    pool.end;
    return res.send(obtenerReceta.rows);
}

const agregarPreparacionAFavoritos = async (req,res) =>{
    let {id_usuario} = req.id_usuario;
    let idPreparacion = req.params.idPreparacion;
    try{
        let response = await pool.query('INSERT INTO preparaciones_favoritos(id_usuario, id_preparacion) VALUES($1, $2);', [id_usuario,idPreparacion]);
        return res.status(200).send(true);
    }catch(err){
        return res.status(200).send(false)
    }
}

const quitarPreparacionAFavoritos = async (req,res) =>{
    let {id_usuario} = req.id_usuario;
    let idPreparacion = req.params.idPreparacion;
    try{
        let response = await pool.query('DELETE FROM preparaciones_favoritos WHERE id_usuario = $1 AND id_preparacion = $2;', [id_usuario,idPreparacion]);
        return res.status(200).send(true);
    }
    catch(err){
        return res.status(200).send(false)
    }
}

const obtenerFavoritosUsuario = async(req,res) =>{
    let {id_usuario} = req.id_usuario;
    let response = await pool.query(`select pf.id_producto,p.nombre,m.nombre as marca,p.cantidad_embase,p.link_imagen,n.kcal_prcn, 1 as favorito
                                        from productos_favoritos pf 
                                        join productos p on pf.id_producto = p.id_producto 
                                        join nutricional n on n.id_nutricional = p.nutricional 
                                        join marcas m on m.id_marca = p.marca 
                                        where pf.id_usuario = $1`,[id_usuario]);
    
    let response2 = await pool.query(`select pf.id_preparacion, p.nombre, n.kcal_prcn, p.link_imagen, 1 as favorito
                                        from preparaciones_favoritos pf
                                        join preparaciones p on p.id_preparacion = pf.id_preparacion 
                                        join nutricional n on p.nutricional = n.id_nutricional 
                                        where pf.id_usuario = $1`,[id_usuario]);
    let respuestas = {
        "productos":response.rows,
        "recetas":response2.rows
    }
    return res.status(200).send(respuestas);
}

const buscarRecetas = async(req,res) => {
    try{
        let {id_usuario} = req.id_usuario;
        let busqueda = req.params.busqueda;
        let response = await pool.query('select * from buscar_preparacion_logeado($1,$2)',[busqueda,id_usuario]);
        return res.status(200).send(response.rows)    
    }catch(err){
        console.log(err)
        return res.status(500).send()
    }
}

const recetasUsuario = async(req,res) => {
    try{
        let {id_usuario} = req.id_usuario;
        let response = await pool.query(`select p.id_preparacion,p.nombre,n.kcal_prcn from preparaciones p
                                            join nutricional n on n.id_nutricional = p.nutricional
                                            where p.id_usuario = $1`,[id_usuario])
        return res.status(200).send(response.rows)
    }
    catch(err){
        console.log(err)
        return res.status(500).send()
    }
}

const obtenerInfoUsuario = async(req,res) => {
    try{
        let {id_usuario} = req.id_usuario;
        let response = await pool.query(`select u.nombre,u.email,u.fecha_nacimiento,u.peso,u.altura,u.sexo,u.objetivo,u.tarjet_calorias,u.es_vegano 
                                            from usuarios u 
                                            where u.id_usuario = $1`,[id_usuario])
        return res.status(200).send(response.rows)
    }
    catch(err){
        console.log(err)
        return res.status(500).send()
    }
}

const detalleReceta = async(req,res) => {
    try{
        let id_preparacion = req.params.id_preparacion;
        let info_receta = await pool.query(`select p.id_preparacion,p.nombre,n.kcal_prcn, n.prot_prcn,n.gr_totales_prcn,n.hidratos_prcn 
                                            from preparaciones p 
                                            join nutricional n on n.id_nutricional = p.nutricional 
                                            where p.id_preparacion = $1`,[id_preparacion])
        let pasos = await pool.query(`select pp.*
                                        from preparaciones p 
                                        join pasos_preparacion pp on p.id_preparacion = pp.id_preparacion 
                                        where p.id_preparacion = $1`,[id_preparacion])

        let lista_productos = await pool.query(`select pp.id_preparacion,pp.cantidad, um.nombre nombre_unidad, pro.nombre nombre_producto, pro.id_producto,
                                            case when um.nombre = 'porcion' then n.kcal_prcn * pp.cantidad 
                                                                            else n.kcal_100/100*pp.cantidad
                                                                            end kcal,
                                            case when um.nombre = 'porcion' then n.prot_prcn  * pp.cantidad 
                                                                            else n.prot_100/100*pp.cantidad
                                                                            end prot,
                                            case when um.nombre = 'porcion' then n.gr_totales_prcn  * pp.cantidad 
                                                                            else n.gr_totales_100/100*pp.cantidad
                                                                            end gr_totales,
                                            case when um.nombre = 'porcion' then n.hidratos_prcn * pp.cantidad 
                                                                            else n.hidratos_100/100*pp.cantidad
                                                                            end hidratos
                                            from preparaciones p 
                                            join productos_preparaciones pp on p.id_preparacion = pp.id_preparacion 
                                            join productos pro on pro.id_producto = pp.id_producto 
                                            join unidades_medida um on um.id_unidad_medida = pp.id_unidad_medida 
                                            join nutricional n on n.id_nutricional = pro.nutricional 
                                            where p.id_preparacion = $1`,[id_preparacion])
        let response_ = {
            lista_productos:lista_productos.rows,
            info_receta:info_receta.rows[0],
            pasos:pasos.rows
        } 
        return res.status(200).send(response_)
    }catch(err){
        return res.status(500).send()
    }
}

const editarInfoUsuario = async(req,res) =>{
    try {
        let {id_usuario} = req.id_usuario;
        let {nombre,fecha_nacimiento,peso,altura,tarjet_calorias,objetivo,es_vegano} = req.body;
        let query = await pool.query(`UPDATE usuarios
        SET nombre = $1, fecha_nacimiento = $2, peso = $3, altura = $4, tarjet_calorias = $5, objetivo = $6, es_vegano = $7
        WHERE id_usuario = $8;`,[nombre,fecha_nacimiento,peso,altura,tarjet_calorias,objetivo,es_vegano,id_usuario]);
        return res.status(200).send(true);
    } catch (error) {
        return res.status(200).send(false);
    }
}


module.exports = {
    obtenerTodosProductos,
    obtenerinformacionNutricionalProductoSimple,
    generarPlanProducto,
    obtenerPlanAlimentacion,
    marcarCheckedPlanProducto,
    obtenerUnidadesMedida,
    obtenerListaProductosSimilitudes,
    registrarUsuario,
    loginUsuario,
    middleware,
    agregarProductoAFavoritos,
    quitarProductoAFavoritos,
    obtenerTodasRecetas,
    agregarPreparacionAFavoritos,
    quitarPreparacionAFavoritos,
    obtenerFavoritosUsuario,
    buscarRecetas,
    recetasUsuario,
    obtenerInfoUsuario,
    detalleReceta,
    upload,
    editarInfoUsuario
}
