const { Router } = require('express');
const router = Router();

const {marcarCheckedPlanProducto,obtenerPlanAlimentacion,obtenerUnidadesMedida,detalleReceta,obtenerInfoUsuario,recetasUsuario,buscarRecetas,obtenerTodosProductos,obtenerinformacionNutricionalProductoSimple,generarPlanProducto,obtenerListaProductosSimilitudes,registrarUsuario,loginUsuario,middleware,agregarProductoAFavoritos,quitarProductoAFavoritos,obtenerTodasRecetas,agregarPreparacionAFavoritos,quitarPreparacionAFavoritos,obtenerFavoritosUsuario} = require('../controllers/index.controllers.js');


//Gets
// router.get('/producto/listaCompletaProductos',middleware,obtenerTodosProductos);
// router.get('/receta/listaCompletaRecetas',middleware,obtenerTodasRecetas);

// obtener info nutricional
router.get('/producto/informacionNutricionalProductoSimple/:id',middleware,obtenerinformacionNutricionalProductoSimple);
// buscar productos
router.get('/producto/buscarProducto/:busqueda',middleware,obtenerListaProductosSimilitudes);
// unidades de medida de producto
router.get('/producto/obtenerUnidadesMedida',middleware,obtenerUnidadesMedida)
// buscar receta
router.get('/recetas/buscarReceta/:busqueda',middleware,buscarRecetas);
// buscar recetas del usuario
router.get('/recetas/recetasUsuario',middleware,recetasUsuario);
// detalle de recetas
router.get('/recetas/detalleReceta/:id_preparacion',middleware,detalleReceta)
// favoritos (productos y recetas)
router.get('/usuario/obtenerFavoritos',middleware,obtenerFavoritosUsuario);
// info de usuario (email, vegano, etc...)
router.get('/usuario/infoUsuario',middleware,obtenerInfoUsuario);
// obtener plan de alimentacion para 1 dia determinado
router.get('/plan/obtenerPlanAlimentacion',middleware,obtenerPlanAlimentacion)


//Posts
router.post('/plan/generarPlanProducto',middleware,generarPlanProducto);
router.post('/usuario/registrarUsuario',registrarUsuario);
router.post('/usuario/loginUsuario',loginUsuario);
router.post('/usuario/agregarFavoritoProducto/:idProducto',middleware,agregarProductoAFavoritos);
router.post('/usuario/agregarFavoritoPreaparacion/:idPreparacion',middleware,agregarPreparacionAFavoritos);

//Delete 
router.delete('/usuario/quitarFavoritoProducto/:idProducto',middleware,quitarProductoAFavoritos);
router.delete('/usuario/quitarFavoritoPreparacion/:idPreparacion',middleware,quitarPreparacionAFavoritos);

//Put
router.put('/plan/marcarCheckedPlanProducto',middleware,marcarCheckedPlanProducto)


module.exports = router;