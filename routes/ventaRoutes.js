const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

// Rutas protegidas
router.post(
  '/',
  verificarToken,
  verificarRol(['admin', 'empleado']), // Solo admin y empleado pueden crear ventas
  ventaController.crearVenta
);

router.get(
  '/',
  verificarToken,
  verificarRol(['admin', 'empleado']), // Solo admin puede obtener todas las ventas
  ventaController.obtenerVentas
);

router.get(
    '/rango-fechas',
    verificarToken,
    verificarRol(['admin']),
    ventaController.obtenerVentasPorRangoFechas
  );

router.get(
    '/productos-mas-vendidos',
    verificarToken,
    verificarRol(['admin']),
    ventaController.obtenerProductosMasVendidos
 );
    
router.get(
  '/:id',
  verificarToken,
  verificarRol(['admin', 'empleado']), // Admin y empleado pueden consultar una venta por ID
  ventaController.obtenerVentaPorId
);

router.put(
  '/:id/estatus',
  verificarToken,
  verificarRol(['admin']), // Solo admin puede actualizar el estado de una venta
  ventaController.actualizarEstatusVenta
);

router.delete(
  '/:id',
  verificarToken,
  verificarRol(['admin']), // Solo admin puede eliminar una venta
  ventaController.eliminarVenta
);


  
  router.get(
    '/estado/:estado',
    verificarToken,
    verificarRol(['admin']),
    ventaController.obtenerVentasPorEstado
  );
  
  router.get(
    '/totales-cliente/:id',
    verificarToken,
    verificarRol(['admin']),
    ventaController.obtenerTotalesPorClienteId
  );


module.exports = router;