const { Router } = require('express');
const router = Router();

const {obtenerTodosProductos,obtenerinformacionNutricionalProductoSimple,generarPlanProducto,obtenerListaProductosSimilitudes} = require('../controllers/index.controllers.js');


//Gets
router.get('/producto/listaCompletaProductos',obtenerTodosProductos);
router.get('/producto/informacionNutricionalProductoSimple/:id',obtenerinformacionNutricionalProductoSimple);
router.get('/producto/informacionNutricionalProductoSimple',obtenerListaProductosSimilitudes)

//Posts
router.post('/producto/generarPlanProducto',generarPlanProducto);


module.exports = router;