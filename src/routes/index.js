const { Router } = require('express');
const router = Router();

const {obtenerTodosProductos,obtenerinformacionNutricionalProductoSimple,generarPlanProducto} = require('../controllers/index.controllers.js');


//Gets

router.get('/producto/listaCompletaProductos',obtenerTodosProductos);
router.get('/producto/informacionNutricionalProductoSimple/:id',obtenerinformacionNutricionalProductoSimple);

//Posts
router.post('/producto/generarPlanProducto',generarPlanProducto);


module.exports = router;