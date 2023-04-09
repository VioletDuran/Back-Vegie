const { Pool } = require('pg');
const { json } = require('express');

const pool = new Pool({
    host: 'ec2-107-23-75-98.compute-1.amazonaws.com',
    user: 'postgres',
    password: 'vegie12',
    database: 'postgres',
    port: '5432'
})

const obtenerTodosProductos = async(req, res) => {
    let obtenerProductos = await pool.query('select id_producto,productos.nombre,marcas.nombre as marca,link_imagen,nutricional.kcal_100 from productos join nutricional ON productos.nutricional = nutricional.id_nutricional join marcas on productos.marca = marcas.id_marca;')
    pool.end;
    return res.send(obtenerProductos.rows);
}


//Se recibe el id del producto atraves del parametro del EndPoint
const obtenerinformacionNutricionalProductoSimple = async(req, res) => {
    let idProducto = req.params.id;
    let obtenerProductos = await pool.query('select nombre,link_imagen,porcion,nutricional.kcal_100,nutricional.prot_100,nutricional.gr_totales_100,nutricional.gr_satu_100,nutricional.gr_mono_100,nutricional.gr_poli_100,nutricional.gr_trans_100,nutricional.colesterol_100,nutricional.hidratos_100,nutricional.azucares_100,nutricional.sodio_100,nutricional.kcal_prcn,nutricional.prot_prcn,nutricional.gr_totales_prcn,nutricional.gr_satu_prcn,nutricional.gr_mono_prcn,nutricional.gr_poli_prcn,nutricional.gr_trans_prcn,nutricional.colesterol_prcn,nutricional.hidratos_prcn,nutricional.azucares_prcn,nutricional.sodio_prcn from productos join nutricional on nutricional.id_nutricional = productos.nutricional where id_producto = $1;',[idProducto])
    pool.end;
    return res.send(obtenerProductos.rows);
}

//Se recibe un objeto JSON por el metodo POST, el cual recibe: id_usuario, fecha, unidad_medida, id_producto, cantidad, checked.
const generarPlanProducto = async(req, res) => {
    let {id_usuario, fecha, unidad_medida, id_producto, cantidad, checked} = req.body;
    let generarPlan = await pool.query('insert into planes_productos(id_usuario,fecha,id_producto,unidad_medida,cantidad,checked) values($1,$2,$3,$4,$5,$6)',[id_usuario,fecha,id_producto,unidad_medida,cantidad,checked]);
    if(generarPlan){
        return res.status(200).send(true);
    }
}

module.exports = {
    obtenerTodosProductos,
    obtenerinformacionNutricionalProductoSimple,
    generarPlanProducto
}