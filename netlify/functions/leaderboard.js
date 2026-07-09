const Redis = require("ioredis");

const KEYS = ['GD_TOP_WAR', 'GD_TOP_ROG', 'GD_TOP_MAG'];

const ALLOWED_ORIGINS = [
  'https://glitchdungeon.netlify.app',   // Production-Domain (ohne Bindestrich!)
  'https://glitch-dungeon.netlify.app',  // Fallback
  'http://localhost:8888',               // Netlify Dev
  'http://localhost:3000'                // Alternativer Dev-Server
];

const RATE_LIMIT = 10;   // Max Requests pro IP
const RATE_WINDOW = 60;  // Fenster in Sekunden

// Rate-Limit über Redis (INCR+EXPIRE): funktioniert instanzübergreifend und
// überlebt Lambda-Cold-Starts - eine In-Memory-Map tut beides nicht.
async function checkRateLimit(client, ip) {
  const key = `GD_RL_${ip}`;
  const count = await client.incr(key);
  if (count === 1) await client.expire(key, RATE_WINDOW);
  return count <= RATE_LIMIT;
}

// Sanitize String - verhindert XSS
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>'"&\/\\]/g, '') // Entferne gefährliche Zeichen
    .replace(/\s+/g, ' ')        // Normalisiere Whitespace
    .trim()
    .substring(0, 30);           // Max 30 Zeichen
}

// Validiere eingehende Daten - wirft Error bei ungültigem Payload.
// Payload: [name, classIdx, depth, moves, kills, deaths, gear[], timestamp, uid]
function validateData(data) {
  if (!Array.isArray(data)) throw new Error("Data must be an array");
  if (data.length !== 9) throw new Error("Data must have exactly 9 elements");

  const [name, classIdx, depth, moves, kills, deaths, gear, , uid] = data;

  if (typeof name !== 'string' || name.length === 0 || name.length > 30) throw new Error("Invalid name");
  if (!Number.isInteger(classIdx) || classIdx < 0 || classIdx > 2) throw new Error("Invalid class");
  if (!Number.isInteger(depth) || depth < 0 || depth > 1000) throw new Error("Invalid depth");
  if (typeof moves !== 'number' || !isFinite(moves) || moves < 0 || moves > 100000) throw new Error("Invalid moves");
  if (!Number.isInteger(kills) || kills < 0 || kills > 100000) throw new Error("Invalid kills");
  if (!Number.isInteger(deaths) || deaths < 0 || deaths > 10000) throw new Error("Invalid deaths");
  // gear ist ein Array von Rarity-Indizes (Waffe/Rüstung/Relikt)
  if (gear && (!Array.isArray(gear) || gear.length > 3 || gear.some(g => !Number.isInteger(g) || g < 0 || g > 12))) throw new Error("Invalid gear");
  if (uid !== null && uid !== undefined && typeof uid !== 'string') throw new Error("Invalid uid");
  if (typeof uid === 'string' && uid.length > 50) throw new Error("UID too long");

  // Plausibilität: große Tiefe ohne jeden Kill ist kein legitimer Run
  if (depth > 10 && kills === 0) throw new Error("Invalid depth/kills ratio");
}

exports.handler = async (event, context) => {
  const origin = event.headers.origin || event.headers.Origin || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  const headers = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Request Size Limit - verhindert Memory-DoS
  if (event.body && event.body.length > 10000) {
    return { statusCode: 413, headers, body: JSON.stringify({ error: 'Payload too large' }) };
  }

  let client;

  try {
    if (!process.env.REDIS_URL) {
      throw new Error("REDIS_URL environment variable is missing");
    }

    client = new Redis(process.env.REDIS_URL, {
      connectTimeout: 10000,
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: false
    });

    // Rate Limiting - verhindert Spam/DoS
    const ip = (event.headers['x-forwarded-for'] || event.headers['X-Forwarded-For'] || 'unknown').split(',')[0].trim();
    if (!(await checkRateLimit(client, ip))) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ error: 'Too many requests. Please try again in a minute.', retryAfter: RATE_WINDOW })
      };
    }

    // POST: Score einreichen
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const { data } = body;

      validateData(data);

      // Sanitize Name - XSS Prevention
      data[0] = sanitizeString(data[0]);

      const classIdx = data[1];
      const key = KEYS[classIdx];

      // Server-side Timestamp - verhindert Manipulation
      data[7] = Date.now();

      const raw = await client.get(key);
      let arr = raw ? JSON.parse(raw) : [];

      // Memory-Safety: Limitiere Array-Größe vor dem Filtern
      if (arr.length > 100) {
        arr = arr.slice(0, 50);
      }

      // Update: Vorherigen Eintrag dieser UID entfernen
      if (data[8]) {
        const sanitizedUid = sanitizeString(data[8]);
        arr = arr.filter(e => e[8] !== sanitizedUid);
      }

      arr.push(data);

      // Sortiere: 1. Tiefe (desc), 2. Ø Züge (asc), 3. Kills (desc)
      arr.sort((a, b) => {
        const depthDiff = (b[2] || 0) - (a[2] || 0);
        if (depthDiff !== 0) return depthDiff;
        const movesDiff = (a[3] || 0) - (b[3] || 0);
        if (movesDiff !== 0) return movesDiff;
        return (b[4] || 0) - (a[4] || 0);
      });

      // Behalte nur Top 5
      arr = arr.slice(0, 5);

      // Speichere mit Expiration (90 Tage)
      await client.setex(key, 60 * 60 * 24 * 90, JSON.stringify(arr));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, rank: arr.findIndex(e => e[8] === data[8]) + 1 })
      };
    }

    // GET: Leaderboard abrufen
    if (event.httpMethod === 'GET') {
      const classParam = event.queryStringParameters?.class || '0';
      const classIdx = parseInt(classParam);

      if (isNaN(classIdx) || classIdx < 0 || classIdx >= KEYS.length) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid class parameter' }) };
      }

      const raw = await client.get(KEYS[classIdx]);
      const top = raw ? JSON.parse(raw) : [];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ top, class: classIdx, lastUpdate: Date.now() })
      };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  } catch (error) {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    if (isDevelopment) {
      console.error('Leaderboard Error:', error);
    }

    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error.message.includes('Invalid') ||
        error.message.includes('must be') ||
        error.message.includes('too')) {
      statusCode = 400;
      errorMessage = isDevelopment ? error.message : 'Invalid request';
    } else if (error.message.includes('REDIS')) {
      statusCode = 503;
      errorMessage = 'Service temporarily unavailable';
    }

    return {
      statusCode,
      headers,
      body: JSON.stringify({
        error: errorMessage,
        ...(isDevelopment && { details: error.message })
      })
    };
  } finally {
    // Verbindung immer schließen (auch bei Errors)
    if (client) {
      try {
        await client.quit();
      } catch (quitError) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Redis quit error:', quitError);
        }
      }
    }
  }
};
