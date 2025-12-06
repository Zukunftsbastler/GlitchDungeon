const Redis = require("ioredis");

const KEYS = ['GD_TOP_WAR', 'GD_TOP_ROG', 'GD_TOP_MAG'];

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  // OPTIONS für CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const client = new Redis(process.env.REDIS_URL);

    if (event.httpMethod === 'POST') {
      // Score einreichen
      const body = JSON.parse(event.body);
      const { data } = body;
      const key = KEYS[data[1]]; // Klassen-Index (0=WAR, 1=ROG, 2=MAG)

      // Hole aktuelle Top 5
      const raw = await client.get(key);
      let arr = raw ? JSON.parse(raw) : [];

      // Füge neuen Score hinzu
      arr.push(data);

      // Sortiere: 1. Tiefe (desc), 2. Ø Züge (asc), 3. Kills (desc)
      arr.sort((a, b) => b[2] - a[2] || a[3] - b[3] || b[4] - a[4]);

      // Behalte nur Top 5
      arr = arr.slice(0, 5);

      // Speichere zurück
      await client.set(key, JSON.stringify(arr));

      client.quit();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true })
      };

    } else {
      // GET: Leaderboard abrufen
      const classIdx = parseInt(event.queryStringParameters.class) || 0;
      const key = KEYS[classIdx];

      const raw = await client.get(key);
      const top = raw ? JSON.parse(raw) : [];

      client.quit();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ top })
      };
    }

  } catch (error) {
    console.error('Leaderboard Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
