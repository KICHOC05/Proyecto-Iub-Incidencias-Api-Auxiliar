const crypto = require("node:crypto");
const express = require("express");
const { pool } = require("../db");
const { requireAuth } = require("../middleware/auth");
const {
  createAttemptSchema,
  createNotificationSchema,
  updateStatusSchema,
} = require("../schemas/notificaciones");

const router = express.Router();

function validationError(res, error) {
  return res.status(422).json({
    detail: "El cuerpo de la solicitud no es valido",
    errors: error.issues,
  });
}

function duplicateError(res, error) {
  if (error.code !== "ER_DUP_ENTRY") return false;
  res.status(409).json({ detail: "El registro ya existe" });
  return true;
}

router.use(requireAuth);

/**
 * @openapi
 * /api/v1/aux/notificaciones:
 *   get:
 *     tags: [Notificaciones]
 *     security: [{ bearerAuth: [] }]
 *     summary: Lista las notificaciones del usuario autenticado
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ListaNotificaciones' }
 *       401: { description: Token ausente o invalido, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       500: { description: Error interno, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const [rows] = await pool.query(
      `SELECT n.public_id, n.usuario_public_id, p.public_id AS plantilla_public_id,
              n.canal, n.payload, n.estado_envio, n.estado, n.creado, n.actualizado
         FROM notificaciones n
         JOIN plantillas_notificacion p ON p.id = n.plantilla_id
        WHERE n.usuario_public_id = ? AND n.estado = 1
        ORDER BY n.creado DESC
        LIMIT ? OFFSET ?`,
      [req.user.publicId, limit, offset],
    );
    return res.json({ items: rows, limit, offset });
  } catch (error) {
    return next(error);
  }
});

/**
 * @openapi
 * /api/v1/aux/notificaciones:
 *   post:
 *     tags: [Notificaciones]
 *     security: [{ bearerAuth: [] }]
 *     summary: Crea una notificacion para el usuario autenticado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CrearNotificacion' }
 *     responses:
 *       201:
 *         description: Notificacion creada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RecursoCreado' }
 *       401: { description: Token ausente o invalido, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Plantilla no encontrada, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       409: { description: Registro duplicado, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       422: { description: Datos invalidos, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       500: { description: Error interno, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.post("/", async (req, res, next) => {
  const result = createNotificationSchema.safeParse(req.body);
  if (!result.success) return validationError(res, result.error);

  try {
    const [templates] = await pool.query(
      "SELECT id FROM plantillas_notificacion WHERE public_id = ? AND estado = 1",
      [result.data.plantilla_public_id],
    );
    if (!templates.length) {
      return res.status(404).json({ detail: "La plantilla no existe" });
    }

    const publicId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO notificaciones
        (public_id, usuario_public_id, plantilla_id, canal, payload, estado_envio)
       VALUES (?, ?, ?, ?, ?, 'PENDIENTE')`,
      [
        publicId,
        req.user.publicId,
        templates[0].id,
        result.data.canal,
        JSON.stringify(result.data.payload),
      ],
    );

    return res.status(201).json({ public_id: publicId });
  } catch (error) {
    if (duplicateError(res, error)) return;
    return next(error);
  }
});

/**
 * @openapi
 * /api/v1/aux/notificaciones/{publicId}:
 *   get:
 *     tags: [Notificaciones]
 *     security: [{ bearerAuth: [] }]
 *     summary: Consulta una notificacion propia
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Notificacion encontrada
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Notificacion' }
 *       401: { description: Token ausente o invalido, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Notificacion no encontrada, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       500: { description: Error interno, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.get("/:publicId", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT n.public_id, n.usuario_public_id, p.public_id AS plantilla_public_id,
              n.canal, n.payload, n.estado_envio, n.estado, n.creado, n.actualizado
         FROM notificaciones n
         JOIN plantillas_notificacion p ON p.id = n.plantilla_id
        WHERE n.public_id = ? AND n.usuario_public_id = ? AND n.estado = 1`,
      [req.params.publicId, req.user.publicId],
    );
    if (!rows.length) return res.status(404).json({ detail: "Notificacion no encontrada" });
    return res.json(rows[0]);
  } catch (error) {
    return next(error);
  }
});

/**
 * @openapi
 * /api/v1/aux/notificaciones/{publicId}/intentos:
 *   post:
 *     tags: [Notificaciones]
 *     security: [{ bearerAuth: [] }]
 *     summary: Registra un intento de envio
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CrearIntento' }
 *     responses:
 *       201:
 *         description: Intento creado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/RecursoCreado' }
 *       401: { description: Token ausente o invalido, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Notificacion no encontrada, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       409: { description: Numero de intento duplicado, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       422: { description: Datos invalidos, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       500: { description: Error interno, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.post("/:publicId/intentos", async (req, res, next) => {
  const result = createAttemptSchema.safeParse(req.body);
  if (!result.success) return validationError(res, result.error);

  try {
    const [notifications] = await pool.query(
      "SELECT id FROM notificaciones WHERE public_id = ? AND usuario_public_id = ? AND estado = 1",
      [req.params.publicId, req.user.publicId],
    );
    if (!notifications.length) {
      return res.status(404).json({ detail: "Notificacion no encontrada" });
    }

    const attemptPublicId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO notificacion_intentos
        (public_id, notificacion_id, numero_intento, exitoso, respuesta)
       VALUES (?, ?, ?, ?, ?)`,
      [
        attemptPublicId,
        notifications[0].id,
        result.data.numero_intento,
        result.data.exitoso,
        result.data.respuesta || null,
      ],
    );
    return res.status(201).json({ public_id: attemptPublicId });
  } catch (error) {
    if (duplicateError(res, error)) return;
    return next(error);
  }
});

/**
 * @openapi
 * /api/v1/aux/notificaciones/{publicId}/estado:
 *   patch:
 *     tags: [Notificaciones]
 *     security: [{ bearerAuth: [] }]
 *     summary: Actualiza el estado logico de una notificacion
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ActualizarEstado' }
 *     responses:
 *       200:
 *         description: Estado actualizado
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/EstadoActualizado' }
 *       401: { description: Token ausente o invalido, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       404: { description: Notificacion no encontrada, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       422: { description: Datos invalidos, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       500: { description: Error interno, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.patch("/:publicId/estado", async (req, res, next) => {
  const result = updateStatusSchema.safeParse(req.body);
  if (!result.success) return validationError(res, result.error);

  try {
    const [notifications] = await pool.query(
      "SELECT id FROM notificaciones WHERE public_id = ? AND usuario_public_id = ?",
      [req.params.publicId, req.user.publicId],
    );
    if (!notifications.length) {
      return res.status(404).json({ detail: "Notificacion no encontrada" });
    }

    await pool.query(
      `UPDATE notificaciones
          SET estado = ?
        WHERE public_id = ? AND usuario_public_id = ?`,
      [result.data.estado, req.params.publicId, req.user.publicId],
    );
    return res.json({ public_id: req.params.publicId, estado: result.data.estado });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
