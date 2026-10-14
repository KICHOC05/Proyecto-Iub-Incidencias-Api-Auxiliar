require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const healthRouter = require("./routes/health");
const notificationsRouter = require("./routes/notificaciones");

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "IUB Auxiliary API",
      version: "0.1.0",
      description: "API auxiliar de notificaciones con MySQL.",
    },
    servers: [{ url: `http://127.0.0.1:${port}` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        Error: {
          type: "object",
          required: ["detail"],
          properties: {
            detail: { type: "string", example: "Notificacion no encontrada" },
            errors: { type: "array", items: { type: "object" } },
          },
        },
        CrearNotificacion: {
          type: "object",
          required: ["plantilla_public_id", "canal", "payload"],
          properties: {
            plantilla_public_id: { type: "string", format: "uuid" },
            canal: { type: "string", example: "EMAIL" },
            payload: {
              type: "object",
              example: {
                incidencia_public_id: "uuid-de-la-incidencia",
                titulo: "Incidencia actualizada",
              },
            },
          },
          example: {
            plantilla_public_id: "00000000-0000-4000-8000-000000000001",
            canal: "EMAIL",
            payload: {
              incidencia_public_id: "00000000-0000-4000-8000-000000000002",
              titulo: "Incidencia actualizada",
            },
          },
        },
        CrearIntento: {
          type: "object",
          required: ["numero_intento", "exitoso"],
          properties: {
            numero_intento: { type: "integer", minimum: 1, example: 1 },
            exitoso: { type: "boolean", example: true },
            respuesta: { type: "string", nullable: true, example: "SMTP 250 OK" },
          },
          example: {
            numero_intento: 1,
            exitoso: true,
            respuesta: "SMTP 250 OK",
          },
        },
        ActualizarEstado: {
          type: "object",
          required: ["estado"],
          properties: {
            estado: { type: "integer", enum: [0, 1], example: 0 },
          },
          example: { estado: 0 },
        },
        Notificacion: {
          type: "object",
          properties: {
            public_id: { type: "string", format: "uuid" },
            usuario_public_id: { type: "string", format: "uuid" },
            plantilla_public_id: { type: "string", format: "uuid" },
            canal: { type: "string", example: "EMAIL" },
            payload: { type: "object" },
            estado_envio: { type: "string", example: "PENDIENTE" },
            estado: { type: "integer", enum: [0, 1], example: 1 },
            creado: { type: "string", format: "date-time" },
            actualizado: { type: "string", format: "date-time" },
          },
        },
        ListaNotificaciones: {
          type: "object",
          properties: {
            items: { type: "array", items: { $ref: "#/components/schemas/Notificacion" } },
            limit: { type: "integer", example: 20 },
            offset: { type: "integer", example: 0 },
          },
        },
        RecursoCreado: {
          type: "object",
          required: ["public_id"],
          properties: {
            public_id: { type: "string", format: "uuid" },
          },
        },
        EstadoActualizado: {
          type: "object",
          required: ["public_id", "estado"],
          properties: {
            public_id: { type: "string", format: "uuid" },
            estado: { type: "integer", enum: [0, 1] },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
});

app.get("/", (_req, res) => {
  res.json({ message: "IUB Auxiliary API esta en linea" });
});
app.use("/health", healthRouter);
app.use("/api/v1/aux/notificaciones", notificationsRouter);
app.get("/openapi.json", (_req, res) => {
  res.json(swaggerSpec);
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((error, _req, res, _next) => {
  console.error(error);
  return res.status(500).json({ detail: "Error interno del servidor" });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`IUB Auxiliary API escuchando en http://127.0.0.1:${port}`);
  });
}

module.exports = app;
