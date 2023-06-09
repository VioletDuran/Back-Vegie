const { Router } = require('express');
const router = Router();

const {eliminarPreparacion,crearPreparacion,marcarCheckedPlanPreparacion,editarPlanPreparacion,eliminarPlanPreparacion,generarPlanPreparacion,editarPlanProducto,eliminarPlanProducto,marcarCheckedPlanProducto,obtenerPlanAlimentacion,obtenerUnidadesMedida,detalleReceta,obtenerInfoUsuario,recetasUsuario,buscarRecetas,obtenerTodosProductos,obtenerinformacionNutricionalProductoSimple,generarPlanProducto,obtenerListaProductosSimilitudes,registrarUsuario,loginUsuario,middleware,agregarProductoAFavoritos,quitarProductoAFavoritos,obtenerTodasRecetas,agregarPreparacionAFavoritos,quitarPreparacionAFavoritos,obtenerFavoritosUsuario,upload,editarInfoUsuario,existeCorreo,obtenerCincoRecetas,obtenerCincoProductos} = require('../controllers/index.controllers.js');


//Gets
// router.get('/producto/listaCompletaProductos',middleware,obtenerTodosProductos);
// router.get('/receta/listaCompletaRecetas',middleware,obtenerTodasRecetas);

// obtener info nutricional
router.get('/producto/informacionNutricionalProductoSimple/:id',middleware,obtenerinformacionNutricionalProductoSimple);
// buscar productos
router.get('/producto/buscarProducto/:busqueda',middleware,obtenerListaProductosSimilitudes);
// unidades de medida de producto
router.get('/producto/obtenerUnidadesMedida/:id_producto',middleware,obtenerUnidadesMedida)
// buscar receta
router.get('/recetas/buscarReceta/:busqueda',middleware,buscarRecetas);
// buscar recetas del usuario
router.get('/recetas/recetasUsuario',middleware,recetasUsuario);
// detalle de recetas
router.get('/recetas/detalleReceta/:id_preparacion',middleware,detalleReceta);
// favoritos (productos y recetas)
router.get('/usuario/obtenerFavoritos',middleware,obtenerFavoritosUsuario);
// info de usuario (email, vegano, etc...)
router.get('/usuario/infoUsuario',middleware,obtenerInfoUsuario);
// obtener plan de alimentacion para 1 dia determinado
router.get('/plan/obtenerPlanAlimentacion/:fecha',middleware,obtenerPlanAlimentacion)


// verificar existencia de un correo
router.get('/usuario/existeCorreo/:email',existeCorreo)
// devolver 5 recetas random
router.get('/recetas/obtenerCincoRecetas',middleware,obtenerCincoRecetas)
// devolver 5 productos random
router.get('/producto/obtenerCincoProductos',middleware,obtenerCincoProductos)


//Posts
router.post('/recetas/guardarFotos',middleware,upload.single("myFile"),(req, res) => {
    res.status(200).send(true)
  });

router.post('/recetas/crearReceta',middleware,crearPreparacion);
router.post('/plan/generarPlanPreparacion',middleware,generarPlanPreparacion);
router.post('/plan/generarPlanProducto',middleware,generarPlanProducto);
router.post('/usuario/registrarUsuario',registrarUsuario);
router.post('/usuario/loginUsuario',loginUsuario);
router.post('/usuario/agregarFavoritoProducto/:idProducto',middleware,agregarProductoAFavoritos);
router.post('/usuario/agregarFavoritoPreaparacion/:idPreparacion',middleware,agregarPreparacionAFavoritos);

//Delete 
router.delete('/usuario/quitarFavoritoProducto/:idProducto',middleware,quitarProductoAFavoritos);
router.delete('/usuario/quitarFavoritoPreparacion/:idPreparacion',middleware,quitarPreparacionAFavoritos);
router.delete('/plan/eliminarPlanProducto/:idPlanProducto',middleware,eliminarPlanProducto);
router.delete('/plan/eliminarPlanPreparacion/:idPlanPreparacion',middleware,eliminarPlanPreparacion);
router.delete('/recetas/eliminarReceta/:id_preparacion',middleware,eliminarPreparacion);

//Put
router.put('/plan/editarPlanProducto',middleware,editarPlanProducto);
router.put('/plan/editarPlanPreparacion',middleware,editarPlanPreparacion);
router.put('/plan/marcarCheckedPlanProducto',middleware,marcarCheckedPlanProducto);
router.put('/plan/marcarCheckedPlanPreparacion',middleware,marcarCheckedPlanPreparacion);
router.put('/usuario/editarInformacion',middleware,editarInfoUsuario);

module.exports = router;