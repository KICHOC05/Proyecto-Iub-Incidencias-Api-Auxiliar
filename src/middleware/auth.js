const jwt = require("jsonwebtoken");

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function unauthorized(res) {
  return res
    .status(401)
    .set("WWW-Authenticate", "Bearer")
    .json({ detail: "No fue posible validar las credenciales" });
}

function requireAuth(req, res, next) {
  const authorization = req.get("authorization") || "";
  const tokenMatch = /^Bearer\s+(\S+)$/i.exec(authorization.trim());
  const secret = process.env.JWT_SECRET_KEY;
  const algorithm = process.env.JWT_ALGORITHM || "HS256";

  if (!tokenMatch || !secret || algorithm !== "HS256") {
    return unauthorized(res);
  }

  try {
    const payload = jwt.verify(tokenMatch[1], secret, {
      algorithms: [algorithm],
      complete: false,
    });

    if (
      typeof payload !== "object" ||
      payload === null ||
      payload.typ !== "access" ||
      typeof payload.sub !== "string" ||
      !UUID_PATTERN.test(payload.sub) ||
      typeof payload.exp !== "number" ||
      !Number.isFinite(payload.exp)
    ) {
      return unauthorized(res);
    }

    req.user = {
      publicId: payload.sub,
      claims: payload,
    };
    return next();
  } catch (_error) {
    return unauthorized(res);
  }
}

module.exports = { requireAuth };
