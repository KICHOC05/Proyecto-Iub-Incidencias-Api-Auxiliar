const { z } = require("zod");

const publicId = z.string().uuid();

const createNotificationSchema = z.object({
  plantilla_public_id: publicId,
  canal: z.string().trim().min(1).max(30),
  payload: z.record(z.string(), z.unknown()),
});

const createAttemptSchema = z.object({
  numero_intento: z.number().int().positive(),
  exitoso: z.boolean(),
  respuesta: z.string().max(65535).nullable().optional(),
});

const updateStatusSchema = z.object({
  estado: z.union([z.literal(0), z.literal(1)]),
});

module.exports = {
  createNotificationSchema,
  createAttemptSchema,
  updateStatusSchema,
};
