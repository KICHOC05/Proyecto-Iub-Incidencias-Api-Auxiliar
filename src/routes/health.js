const express = require("express");
const { checkDatabase } = require("../db");

const router = express.Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Salud]
 *     summary: Comprueba la disponibilidad de Express y MySQL
 *     responses:
 *       200:
 *         description: Servicio y base de datos disponibles
 *       503:
 *         description: Servicio disponible, pero MySQL no responde
 *       500:
 *         description: Error interno
 */
router.get("/", async (_req, res) => {
  try {
    await checkDatabase();
    return res.json({
      status: "ok",
      service: "iub-auxiliary-api",
      database: "ok",
    });
  } catch (_error) {
    return res.status(503).json({
      status: "degraded",
      service: "iub-auxiliary-api",
      database: "unavailable",
    });
  }
});

module.exports = router;
