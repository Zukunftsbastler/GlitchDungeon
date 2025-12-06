import Redis from "ioredis";

const KEYS = ['GD_TOP_WAR', 'GD_TOP_ROG', 'GD_TOP_MAG'];

export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };
  
  // OPTIONS für CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers 
    });
  }
  
  try {
    const client = new Redis(process.env.REDIS_URL);
    
    if (req.method === 'POST') {
      // Score einreichen
      const { data } = await req.json();
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
      
      return new Response(JSON.stringify({ ok: true }), {
        headers,
        status: 200
      });
      
    } else {
      // GET: Leaderboard abrufen
      const url = new URL(req.url);
      const classIdx = parseInt(url.searchParams.get('class')) || 0;
      const key = KEYS[classIdx];
      
      const raw = await client.get(key);
      const top = raw ? JSON.parse(raw) : [];
      
      client.quit();
      
      return new Response(JSON.stringify({ top }), {
        headers,
        status: 200
      });
    }
    
  } catch (error) {
    console.error('Leaderboard Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers,
      status: 500
    });
  }
};