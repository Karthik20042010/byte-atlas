import { corsHeaders } from '@supabase/supabase-js/cors'
import { createClient } from "https://esm.sh/mysql2@3.9.2/promise";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const MYSQL_HOST = Deno.env.get('MYSQL_HOST');
  const MYSQL_PORT = Deno.env.get('MYSQL_PORT') || '3306';
  const MYSQL_USER = Deno.env.get('MYSQL_USER');
  const MYSQL_PASSWORD = Deno.env.get('MYSQL_PASSWORD');
  const MYSQL_DATABASE = Deno.env.get('MYSQL_DATABASE');

  if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
    return new Response(
      JSON.stringify({ error: 'MySQL connection not configured. Add MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE secrets.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { table, filters } = await req.json();
    
    const allowedTables = ['items', 'drives', 'users', 'file_versions', 'blobs', 'permissions', 'subjects', 'sync_runs', 'file_properties'];
    if (!allowedTables.includes(table)) {
      return new Response(
        JSON.stringify({ error: `Invalid table: ${table}. Allowed: ${allowedTables.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const connection = await createClient({
      host: MYSQL_HOST,
      port: parseInt(MYSQL_PORT),
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
    });

    let query = `SELECT * FROM \`${table}\``;
    const params: string[] = [];

    if (filters && typeof filters === 'object') {
      const conditions: string[] = [];
      for (const [key, value] of Object.entries(filters)) {
        if (typeof key === 'string' && /^[a-zA-Z_]+$/.test(key)) {
          conditions.push(`\`${key}\` = ?`);
          params.push(String(value));
        }
      }
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    query += ' LIMIT 1000';

    const [rows] = await connection.execute(query, params);
    await connection.end();

    return new Response(
      JSON.stringify({ data: rows }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('MySQL query error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
