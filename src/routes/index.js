const { Router } = require('express');
const router = Router();

const {obtenerTodosProductos,obtenerinformacionNutricionalProductoSimple,generarPlanProducto,obtenerListaProductosSimilitudes,registrarUsuario,loginUsuario,middleware,agregarProductoAFavoritos,quitarProductoAFavoritos} = require('../controllers/index.controllers.js');


//Gets
router.get('/producto/listaCompletaProductos',middleware,obtenerTodosProductos);
router.get('/producto/informacionNutricionalProductoSimple/:id',middleware,obtenerinformacionNutricionalProductoSimple);
router.get('/producto/busquedaSimilitudes/:palabra',middleware,obtenerListaProductosSimilitudes)

//Posts
router.post('/producto/generarPlanProducto',middleware,generarPlanProducto);
router.post('/usuario/registrarUsuario',registrarUsuario);
router.post('/usuario/loginUsuario',loginUsuario);
router.post('/usuario/agregarFavoritoProducto/:idProducto',middleware,agregarProductoAFavoritos);

//Delete 
router.delete('/usuario/quitarFavoritoProducto/:idProducto',middleware,quitarProductoAFavoritos);

module.exports = router;