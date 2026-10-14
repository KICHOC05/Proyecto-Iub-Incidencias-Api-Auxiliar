CREATE TABLE IF NOT EXISTS plantillas_notificacion (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) NOT NULL,
  codigo VARCHAR(100) NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  asunto VARCHAR(255) NOT NULL,
  contenido TEXT NOT NULL,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  creado DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  actualizado DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_plantillas_public_id (public_id),
  UNIQUE KEY uq_plantillas_codigo (codigo)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS notificaciones (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) NOT NULL,
  usuario_public_id CHAR(36) NOT NULL,
  plantilla_id BIGINT UNSIGNED NOT NULL,
  canal VARCHAR(30) NOT NULL,
  payload JSON NOT NULL,
  estado_envio VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
  estado TINYINT(1) NOT NULL DEFAULT 1,
  creado DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  actualizado DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_notificaciones_public_id (public_id),
  KEY ix_notificaciones_usuario (usuario_public_id),
  KEY ix_notificaciones_plantilla (plantilla_id),
  CONSTRAINT fk_notificaciones_plantilla
    FOREIGN KEY (plantilla_id) REFERENCES plantillas_notificacion (id)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS notificacion_intentos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id CHAR(36) NOT NULL,
  notificacion_id BIGINT UNSIGNED NOT NULL,
  numero_intento INT UNSIGNED NOT NULL,
  exitoso TINYINT(1) NOT NULL DEFAULT 0,
  respuesta TEXT NULL,
  estado TINYINT(1) NOT NULL DEFAULT 1,
  creado DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  actualizado DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_intentos_public_id (public_id),
  UNIQUE KEY uq_intentos_numero (notificacion_id, numero_intento),
  KEY ix_intentos_notificacion (notificacion_id),
  CONSTRAINT fk_intentos_notificacion
    FOREIGN KEY (notificacion_id) REFERENCES notificaciones (id)
) ENGINE = InnoDB;
