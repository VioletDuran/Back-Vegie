const { Pool } = require('pg');
const { json } = require('express');


function middleware(req,res,next){
    const token = req.headers['token'];
    const dotenv = require('dotenv').config({ path: 'pass.env' });
    const secretKey = process.env.secretkey;
    const jwt = require('jsonwebtoken');
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(404).send(false);
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
    let obtenerProductos = await pool.query('select nombre,porcion,nutricional.kcal_100,nutricional.prot_100,nutricional.gr_totales_100,nutricional.gr_satu_100,nutricional.gr_mono_100,nutricional.gr_poli_100,nutricional.gr_trans_100,nutricional.colesterol_100,nutricional.hidratos_100,nutricional.azucares_100,nutricional.sodio_100,nutricional.kcal_prcn,nutricional.prot_prcn,nutricional.gr_totales_prcn,nutricional.gr_satu_prcn,nutricional.gr_mono_prcn,nutricional.gr_poli_prcn,nutricional.gr_trans_prcn,nutricional.colesterol_prcn,nutricional.hidratos_prcn,nutricional.azucares_prcn,nutricional.sodio_prcn from productos join nutricional on nutricional.id_nutricional = productos.nutricional where id_producto = $1;',[idProducto])
    pool.end;
    return res.send(obtenerProductos.rows);
}

//Se recibe un objeto JSON por el metodo POST, el cual recibe: id_usuario, fecha, unidad_medida, id_producto, cantidad, checked.
const generarPlanProducto = async(req, res) => {
    let {id_usuario} = req.id_usuario;
    let {fecha, unidad_medida, id_producto, cantidad, checked} = req.body;
    let generarPlan = await pool.query('insert into planes_productos(id_usuario,fecha,id_producto,unidad_medida,cantidad,checked) values($1,$2,$3,$4,$5,$6)',[id_usuario,fecha,id_producto,unidad_medida,cantidad,checked]);
    if(generarPlan){
        return res.status(200).send(true);
    }
}

const obtenerListaProductosSimilitudes = async(req,res) =>{
    let nombre = req.params.palabra;
    let responseQuery = await pool.query('select * from buscar_producto($1)',[nombre]);
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
    let response = await pool.query('INSERT INTO productos_favoritos (id_usuario, id_producto) VALUES($1, $2);', [id_usuario,idProducto]);
    return res.status(200).send(true);
}

const quitarProductoAFavoritos = async (req,res) =>{
    let {id_usuario} = req.id_usuario;
    let idProducto = req.params.idProducto;
    let response = await pool.query('DELETE FROM productos_favoritos WHERE id_usuario = $1 AND id_producto= $2;', [id_usuario,idProducto]);
    return res.status(200).send(true);
}

module.exports = {
    obtenerTodosProductos,
    obtenerinformacionNutricionalProductoSimple,
    generarPlanProducto,
    obtenerListaProductosSimilitudes,
    registrarUsuario,
    loginUsuario,
    middleware,
    agregarProductoAFavoritos,
    quitarProductoAFavoritos
}