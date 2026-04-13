import { corsHeaders } from '@supabase/supabase-js/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const CLIENT_ID = Deno.env.get('AWS_BEDROCK_CLIENT_ID');
  const CLIENT_SECRET = Deno.env.get('AWS_BEDROCK_CLIENT_SECRET');
  const REGION = Deno.env.get('AWS_BEDROCK_REGION') || 'us-east-1';

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return new Response(
      JSON.stringify({ error: 'AWS Bedrock credentials not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { messages, max_tokens = 4500, temperature = 0.7, model = 'anthropic.claude-3-5-sonnet-20241022-v2:0' } = await req.json();

    // Use AWS Bedrock Runtime API via IAM auth
    const endpoint = `https://bedrock-runtime.${REGION}.amazonaws.com/model/${model}/invoke`;

    // Format messages for Claude
    const systemMsg = messages.find((m: any) => m.role === 'system');
    const chatMessages = messages.filter((m: any) => m.role !== 'system');

    const body = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens,
      temperature,
      ...(systemMsg ? { system: systemMsg.content } : {}),
      messages: chatMessages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    };

    // Sign the request with AWS Signature V4
    const now = new Date();
    const dateStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const shortDate = dateStamp.slice(0, 8);

    const encoder = new TextEncoder();
    const payloadStr = JSON.stringify(body);

    // Create canonical request components
    const method = 'POST';
    const uri = `/model/${encodeURIComponent(model)}/invoke`;
    const host = `bedrock-runtime.${REGION}.amazonaws.com`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Host': host,
      'X-Amz-Date': dateStamp,
    };

    const signedHeaderKeys = Object.keys(headers).sort().map(k => k.toLowerCase()).join(';');

    // Hash payload
    const payloadHash = Array.from(
      new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(payloadStr)))
    ).map(b => b.toString(16).padStart(2, '0')).join('');

    const canonicalHeaders = Object.keys(headers).sort()
      .map(k => `${k.toLowerCase()}:${headers[k].trim()}`).join('\n') + '\n';

    const canonicalRequest = [method, uri, '', canonicalHeaders, signedHeaderKeys, payloadHash].join('\n');

    const credentialScope = `${shortDate}/${REGION}/bedrock/aws4_request`;

    const canonicalRequestHash = Array.from(
      new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(canonicalRequest)))
    ).map(b => b.toString(16).padStart(2, '0')).join('');

    const stringToSign = ['AWS4-HMAC-SHA256', dateStamp, credentialScope, canonicalRequestHash].join('\n');

    // Derive signing key
    async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
      const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
    }

    const kDate = await hmacSha256(encoder.encode('AWS4' + CLIENT_SECRET), shortDate);
    const kRegion = await hmacSha256(kDate, REGION);
    const kService = await hmacSha256(kRegion, 'bedrock');
    const kSigning = await hmacSha256(kService, 'aws4_request');

    const signature = Array.from(
      new Uint8Array(await crypto.subtle.sign('HMAC',
        await crypto.subtle.importKey('raw', kSigning, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
        encoder.encode(stringToSign)
      ))
    ).map(b => b.toString(16).padStart(2, '0')).join('');

    const authHeader = `AWS4-HMAC-SHA256 Credential=${CLIENT_ID}/${credentialScope}, SignedHeaders=${signedHeaderKeys}, Signature=${signature}`;

    const response = await fetch(`https://${host}${uri}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Authorization': authHeader,
      },
      body: payloadStr,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bedrock error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Bedrock API error [${response.status}]: ${errorText}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();

    // Transform Claude response to OpenAI-like format
    const content = result.content?.[0]?.text || '';

    return new Response(
      JSON.stringify({
        choices: [{ message: { role: 'assistant', content } }],
        usage: result.usage,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Bedrock proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
