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

/* ----------------------------------------- */
/* ---------- PLANES PRODUCTOS ------------- */
/* ----------------------------------------- */

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

const editarPlanProducto = async(req, res) => {
    try{
        let {id_usuario} = req.id_usuario;
        let { id_plan_producto, unidad_medida, cantidad, checked,momento_dia } = req.body;
        let updated = await pool.query(`update planes_productos
                                        set unidad_medida = $2,
                                            cantidad = $3,
                                            checked = $4,
                                            momento_dia = $5
                                        where id_plan_producto = $1
                                        and id_usuario = $6`,[id_plan_producto,unidad_medida,cantidad,checked,momento_dia,id_usuario])
        
        updated = updated.rowCount ? true : false
        return res.status(200).send(updated)

    }
    catch(err){
        console.log(err)
        return res.status(500).send(false)
    }
}

const eliminarPlanProducto = async(req,res) => {
    try{
        let {id_usuario} = req.id_usuario;
        let idPlanProducto = req.params.idPlanProducto;
        let deleted = await pool.query(`delete from planes_productos 
                            where id_plan_producto = $1
                            and id_usuario = $2`,[idPlanProducto, id_usuario]);
        
        deleted = deleted.rowCount ? true : false;
        return res.status(200).send(deleted);
    }
    catch(err){
        console.log(err);
        return res.status(500).send(false);
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

/* ----------------------------------------- */
/* --------- PLANES PREPARACIONES ---------- */
/* ----------------------------------------- */

const generarPlanPreparacion = async(req,res) => {
    try{
        let {id_usuario} = req.id_usuario
        let { fecha,id_preparacion, checked, momento_dia, cantidad } = req.body
        let generarPlan = await pool.query(`insert into planes_preparaciones(id_usuario,fecha,id_preparacion,checked,momento_dia,cantidad)
                                            values ($1,$2,$3,$4,$5,$6)`,[id_usuario,fecha,id_preparacion,checked,momento_dia,cantidad])
        generarPlan = generarPlan.rowCount ? true : false;
        return res.status(200).send(generarPlan)
    }
    catch(err){
        console.log(err)
        return res.status(500).send(false)
    }
}

const eliminarPlanPreparacion = async(req,res) => {
    try{
        let {id_usuario} = req.id_usuario
        let idPlanPreparacion = req.params.idPlanPreparacion
        let deleted = await pool.query(`delete from planes_preparaciones 
                                        where id_usuario = $1 and id_plan_preparacion = $2`,[id_usuario, idPlanPreparacion])
        deleted = deleted.rowCount ? true : false
        return res.status(200).send(deleted) 
    }
    catch(err){
        console.log(err)
        return res.status(500).send(false)
    }
}

const editarPlanPreparacion = async(req,res) => {
    try{
        let {id_usuario} = req.id_usuario
        let {id_plan_preparacion,checked, momento_dia, cantidad} = req.body
        let updated = await pool.query(`update planes_preparaciones
                                        set checked = $1,
                                            momento_dia = $2,
                                            cantidad = $3
                                        where id_usuario = $4 and id_plan_preparacion = $5`,[checked,momento_dia,cantidad,id_usuario,id_plan_preparacion])
        updated = updated.rowCount ? true : false;
        return res.status(200).send(updated)
    }
    catch(err){
        console.log(err)
        return res.status(500).send(false)
    }
}

const marcarCheckedPlanPreparacion = async(req,res) => {
    try{
        let {id_usuario} = req.id_usuario
        let {id_plan_preparacion,checked} = req.body
        await pool.query(`update planes_preparaciones 
                            set checked = $1 
                            where id_usuario = $2
                            and id_plan_preparacion = $3`,[checked,id_usuario,id_plan_preparacion])
       
        let is_checked = await pool.query(`select checked from planes_preparaciones
                                            where id_usuario=$1 
                                            and id_plan_preparacion=$2`,[id_usuario,id_plan_preparacion])
        
        return res.status(200).send({checked:is_checked.rows[0].checked})
    }
    catch(err){
        console.log(err)
        return res.status(500).send(false)
    }
}

/* ----------------------------------------- */
/* ------------  PREPARACIONES ------------- */
/* ----------------------------------------- */

const crearPreparacion = async(req,res) => {
    let id_preparacion;
    try{
        let {id_usuario} = req.id_usuario
        let {nombre,lista_productos,pasos} = req.body
        let lista_productos_ok = ''

        // procesar productos
        for(let i=0 ; i<lista_productos.length ; i++){
            let new_prod = `('${lista_productos[i].id_producto}',${lista_productos[i].id_unidad_medida},${lista_productos[i].cantidad})`
            if(i!=0){
                lista_productos_ok += ','
            }
            lista_productos_ok += new_prod
            
        }
        // crear preparacion
        await pool.query(`call crear_preparacion($1,$2,'sin imagen',array[${lista_productos_ok}]::productos_preparaciones_type[])`,[id_usuario,nombre])
        id_preparacion = await pool.query(`select max(id_preparacion) from preparaciones`)
        id_preparacion = id_preparacion.rows[0].max
    }
    catch(err){
        console.log(err)
        return res.status(500).send(false)
    }
    // anadir los pasos a la preparacion
    try{
        let {nombre,lista_productos,pasos} = req.body
        for(let i=0 ; i<pasos.length ; i++){
            await pool.query(`insert into pasos_preparacion
                              values($1,$2,$3)`,[id_preparacion,
                                                pasos[i].n_paso,
                                                pasos[i].descripcion])
        }
        return res.status(200).json({id_preparacion})
    }
    catch(err){
        console.log(err)
        return res.status(200).json({id_preparacion})
    }
}

const eliminarPreparacion = async(req,res)=>{
    try{
        let {id_usuario} = req.id_usuario
        let id_preparacion = req.params.id_preparacion
        let deleted = await pool.query(`update preparaciones 
                                            set borrado = true
                                            where id_preparacion = $1
                                            and id_usuario = $2`,[id_preparacion,id_usuario])
        deleted = deleted.rowCount ? true : false;
        return res.status(200).send(deleted)

    }
    catch(err){
        console.log(err)
        return res.status(500).send()
    }
}


/* ----------------------------------------- */
/* --------- -------------------- ---------- */
/* ----------------------------------------- */

const obtenerUnidadesMedida = async(req,res) => {
    try{
        let id_producto = req.params.id_producto
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
        let fecha = req.params.fecha
        let plan_producto = await pool.query(`select pp.*,um.nombre as nombre_unidad,p.nombre, case when pp.unidad_medida = 1 
                                                                                                then round(pp.cantidad*n.kcal_prcn)
                                                                                                else round(pp.cantidad*n.kcal_100/100)
                                                                                            end kcal
                                                from planes_productos pp 
                                                join productos p on pp.id_producto = p.id_producto 
                                                join nutricional n on p.nutricional = n.id_nutricional
                                                join unidades_medida um on um.id_unidad_medida = pp.unidad_medida 
                                                where pp.fecha=$1 and pp.id_usuario=$2`,[fecha,id_usuario])

        let planes_preparaciones = await pool.query(`select pp.*, round(n.kcal_prcn*pp.cantidad) as kcal, p.nombre as nombre
                                                        from planes_preparaciones pp 
                                                        join preparaciones p on pp.id_preparacion = p.id_preparacion 
                                                        join nutricional n on n.id_nutricional = p.nutricional 
                                                        where pp.id_usuario = $1
                                                        and pp.fecha = $2`,[id_usuario, fecha])    
    
        let plan = {
            productos: plan_producto.rows,
            preparaciones: planes_preparaciones.rows
        }
        return res.status(200).send(plan)
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
    try{
        let {email,nombre,password,fecha_nacimiento,peso,altura,sexo,objetivo,tarjet_calorias,es_vegano,nivel_actividad} = req.body;
        const bcrypt = require('bcrypt');
        const saltRounds = 10;
        let auxContraseña =  bcrypt.hashSync(password, saltRounds, (err, hash) => {
            if (err) throw (err)
            contraseña = hash;
        });
        let response = await pool.query('select email from usuarios where email = $1',[email]);
        if(response.rows.length == 0){
            let responseQuery = await pool.query('INSERT INTO usuarios(nombre, email, password, fecha_nacimiento, peso, altura, sexo, objetivo, tarjet_calorias, es_vegano,nivel_actividad) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',[nombre,email,auxContraseña,fecha_nacimiento,peso,altura,sexo,objetivo,tarjet_calorias,es_vegano,nivel_actividad]);
            return res.status(200).send(true);
        }else{
            return res.status(401).send(false);
        }
    }
    catch(err){
        console.log(err)
        return res.status(500).send(false)
    }
}

const loginUsuario = async (req,res) => {
    try{
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
    }catch(error){
        console.log(error);
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
                                        where pf.id_usuario = $1
                                        and p.borrado = false`,[id_usuario]);
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
                                            where p.id_usuario = $1
                                            and p.borrado = false`,[id_usuario])
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
        let response = await pool.query(`select u.nombre,u.email,u.fecha_nacimiento,u.peso,u.altura,u.sexo,u.objetivo,u.tarjet_calorias,u.es_vegano,u.nivel_actividad 
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
                                            case when um.nombre = 'porción' then round(n.kcal_prcn * pp.cantidad )
                                                                            else round(n.kcal_100/100*pp.cantidad)
                                                                            end kcal,
                                            case when um.nombre = 'porción' then round(n.prot_prcn  * pp.cantidad) 
                                                                            else round(n.prot_100/100*pp.cantidad)
                                                                            end prot,
                                            case when um.nombre = 'porción' then round(n.gr_totales_prcn  * pp.cantidad) 
                                                                            else round(n.gr_totales_100/100*pp.cantidad)
                                                                            end gr_totales,
                                            case when um.nombre = 'porción' then round(n.hidratos_prcn * pp.cantidad) 
                                                                            else round(n.hidratos_100/100*pp.cantidad)
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
        let {nombre,fecha_nacimiento,peso,altura,tarjet_calorias,objetivo,es_vegano,nivel_actividad} = req.body;
        let query = await pool.query(`UPDATE usuarios
        SET nombre = $1, fecha_nacimiento = $2, peso = $3, altura = $4, tarjet_calorias = $5, objetivo = $6, es_vegano = $7, nivel_actividad = $9
        WHERE id_usuario = $8;`,[nombre,fecha_nacimiento,peso,altura,tarjet_calorias,objetivo,es_vegano,id_usuario,nivel_actividad]);
        return res.status(200).send(true);
    } catch (error) {
        return res.status(200).send(false);
    }
}

const existeCorreo = async(req,res) =>{
    try{
        let email = req.params.email;
        let query = await pool.query("select email from usuarios where email = $1",[email]);
        if(query.rows.length >= 1){
            return res.status(200).send(true);
        }else{
            return res.status(200).send(false);
        }
    }catch(error){
        console.log("error!");
    }
}

const obtenerCincoRecetas = async(req,res) =>{
    try{
        let {id_usuario} = req.id_usuario;
        let obtenerReceta = await pool.query('select p.nombre, n.kcal_prcn, p.link_imagen, es_preparacion_favorita($1,p.id_preparacion) from preparaciones p join nutricional n on p.nutricional = n.id_nutricional order by RANDOM() LIMIT 5;',[id_usuario]);
        pool.end;
        return res.send(obtenerReceta.rows);
    }catch(error){
        return res.status(200).send(false);
    }
}

const obtenerCincoProductos = async(req,res)=>{
    try{
        let {id_usuario} = req.id_usuario;
        let obtenerProductos = await pool.query('select p.id_producto,p.nombre,marcas.nombre as marca,nutricional.kcal_100,es_producto_favorito($1,p.id_producto) from usuarios u join productos_favoritos pf on pf.id_usuario = u.id_usuario right join productos p on p.id_producto = pf.id_producto join nutricional ON p.nutricional = nutricional.id_nutricional join marcas on p.marca = marcas.id_marca order by RANDOM() LIMIT 5',[id_usuario]);
        pool.end;
        return res.send(obtenerProductos.rows);
    }catch(error){
        return res.status(200).send(false);
    }
}


module.exports = {
    obtenerTodosProductos,
    obtenerinformacionNutricionalProductoSimple,
    generarPlanProducto,
    editarPlanProducto,
    marcarCheckedPlanProducto,
    eliminarPlanProducto,
    generarPlanPreparacion,
    editarPlanPreparacion,
    marcarCheckedPlanPreparacion,
    eliminarPlanPreparacion,
    obtenerPlanAlimentacion,
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
    editarInfoUsuario,
    crearPreparacion,
    eliminarPreparacion,
    existeCorreo,
    obtenerCincoRecetas,
    obtenerCincoProductos
}
