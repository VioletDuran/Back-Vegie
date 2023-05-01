const { Router } = require('express');
const router = Router();

const {detalleReceta,obtenerInfoUsuario,recetasUsuario,buscarRecetas,obtenerTodosProductos,obtenerinformacionNutricionalProductoSimple,generarPlanProducto,obtenerListaProductosSimilitudes,registrarUsuario,loginUsuario,middleware,agregarProductoAFavoritos,quitarProductoAFavoritos,obtenerTodasRecetas,agregarPreparacionAFavoritos,quitarPreparacionAFavoritos,obtenerFavoritosUsuario} = require('../controllers/index.controllers.js');


//Gets
// router.get('/producto/listaCompletaProductos',middleware,obtenerTodosProductos);
// router.get('/receta/listaCompletaRecetas',middleware,obtenerTodasRecetas);
router.get('/producto/informacionNutricionalProductoSimple/:id',middleware,obtenerinformacionNutricionalProductoSimple);
router.get('/producto/buscarProducto/:busqueda',middleware,obtenerListaProductosSimilitudes);
router.get('/recetas/buscarReceta/:busqueda',middleware,buscarRecetas);
router.get('/recetas/recetasUsuario',middleware,recetasUsuario);
router.get('/recetas/detalleReceta/:id_preparacion',middleware,detalleReceta)
router.get('/usuario/obtenerFavoritos',middleware,obtenerFavoritosUsuario);
router.get('/usuario/infoUsuario',middleware,obtenerInfoUsuario);


//Posts
router.post('/producto/generarPlanProducto',middleware,generarPlanProducto);
router.post('/usuario/registrarUsuario',registrarUsuario);
router.post('/usuario/loginUsuario',loginUsuario);
router.post('/usuario/agregarFavoritoProducto/:idProducto',middleware,agregarProductoAFavoritos);
router.post('/usuario/agregarFavoritoPreaparacion/:idPreparacion',middleware,agregarPreparacionAFavoritos);

//Delete 
router.delete('/usuario/quitarFavoritoProducto/:idProducto',middleware,quitarProductoAFavoritos);
router.delete('/usuario/quitarFavoritoPreparacion/:idPreparacion',middleware,quitarPreparacionAFavoritos);

module.exports = router;