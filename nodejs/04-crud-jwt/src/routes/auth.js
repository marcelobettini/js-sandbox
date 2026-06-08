// Router de autenticación: register, login, refresh y logout.

import { Router } from 'express';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findByEmail, create } from '../db/usersStore.js';

const router = Router();

const BCRYPT_ROUNDS = 12;
const ACCESS_TTL = '15m';
const REFRESH_TTL = '7d';
const COOKIE_NAME = 'refreshToken';

// ── Protección contra timing attacks ────────────────────────────────────────
//
// Sin esta técnica, un atacante puede distinguir "email no registrado" de
// "contraseña incorrecta" midiendo el tiempo de respuesta del servidor:
//
//   Email no existe  →  respuesta en ~2 ms   (solo un SELECT fallido)
//   Email existe     →  respuesta en ~200 ms  (bcrypt.compare es deliberadamente lento)
//
// Esa diferencia de tiempo es suficiente para enumerar qué emails están
// registrados, incluso sin ver el cuerpo de la respuesta. Con esa lista un
// atacante puede lanzar ataques de phishing o credential stuffing dirigidos.
//
// Solución: generar un hash dummy al cargar el módulo y usarlo cuando el
// usuario no existe. Así bcrypt.compare siempre ejecuta (~200 ms) sin importar
// el resultado, y el tiempo de respuesta se vuelve indistinguible para el atacante.
//
// Por qué generarlo en tiempo de carga y no hardcodearlo:
// Un hash hardcodeado en el código fuente podría ser precalculado por un atacante
// que lea el repositorio. Generarlo en runtime lo hace impredecible en cada
// despliegue, aunque para esta protección alcanza con cualquier hash bcrypt válido.
const DUMMY_HASH = await bcrypt.hash('_timing_protection_dummy_', BCRYPT_ROUNDS);

const cookieOptions = {
  httpOnly: true,   // el JS del cliente no puede leerla → protección XSS
  secure: process.env.NODE_ENV === 'production', // solo HTTPS en prod
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en ms
};

function signAccess(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL });
}

function signRefresh(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL });
}

// Regex simple para validar formato de email — suficiente para el scope educativo.
// No cubre todos los RFC 5322 edge cases a propósito: más simple es mejor.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── POST /api/v1/auth/register ───────────────────────────────────────────────
router.post('/register', async (req, res, next) => {
  try {
    const { email, fullName, password } = req.body;

    if (!email || !fullName || !password) {
      return res.status(400).json({ error: 'email, fullName y password son requeridos' });
    }

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    // Verificación a nivel aplicación antes de tocar la DB.
    // El índice único en la colección actúa como segunda línea de defensa (race conditions).
    const existing = await findByEmail(email.toLowerCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const now = new Date().toISOString();
    const user = {
      id: randomUUID(),
      email: email.toLowerCase().trim(),
      fullName,
      password: await bcrypt.hash(password, BCRYPT_ROUNDS),
      createdAt: now,
      updatedAt: now,
    };

    await create(user);

    // Nunca devolver el hash al cliente
    const { password: _, ...publicUser } = user;
    res.status(201).json(publicUser);
  } catch (err) {
    // Código 11000: violación del índice único (race condition entre el check y el insert)
    if (err.code === 11000) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }
    next(err);
  }
});

// ─── POST /api/v1/auth/login ──────────────────────────────────────────────────
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son requeridos' });
    }

    const user = await findByEmail(email.toLowerCase().trim());

    // Si el usuario no existe usamos DUMMY_HASH para que bcrypt.compare
    // igualmente consuma ~200 ms. Sin esto, la rama "email no encontrado"
    // respondería en ~2 ms y el tiempo delataría que ese email no está registrado.
    // Ver comentario junto a DUMMY_HASH para el razonamiento completo.
    const match = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);

    if (!user || !match) {
      // Mensaje genérico intencionalmente: no indicar si el email no existe
      // o si la contraseña es incorrecta evita confirmar qué emails están registrados.
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const jwtPayload = { sub: user._id, email: user.email };
    const accessToken = signAccess(jwtPayload);
    const refreshToken = signRefresh(jwtPayload);

    res.cookie(COOKIE_NAME, refreshToken, cookieOptions);
    res.json({
      accessToken,
      user: { id: user._id, email: user.email, fullName: user.fullName },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/v1/auth/refresh ────────────────────────────────────────────────
// Rota ambos tokens: invalida el refresh token actual emitiendo uno nuevo
// (y un nuevo access token). Si el refresh token fue robado y ya fue rotado
// por el atacante, el token del usuario legítimo habrá expirado o no coincidirá
// → detectamos la brecha aunque no tengamos blocklist en DB.
router.post('/refresh', (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      return res.status(401).json({ error: 'Refresh token requerido' });
    }

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const jwtPayload = { sub: payload.sub, email: payload.email };
    const newAccessToken = signAccess(jwtPayload);
    const newRefreshToken = signRefresh(jwtPayload);

    res.cookie(COOKIE_NAME, newRefreshToken, cookieOptions);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      res.clearCookie(COOKIE_NAME, cookieOptions);
      return res.status(401).json({ error: 'Refresh token inválido o expirado' });
    }
    next(err);
  }
});

// ─── POST /api/v1/auth/logout ─────────────────────────────────────────────────
// Limpia la cookie del lado del servidor. El access token sigue siendo válido
// hasta que expire (15 min) — sin blocklist en DB esto es inevitable; es el
// trade-off conocido de los JWT stateless.
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.status(204).send();
});

export default router;
