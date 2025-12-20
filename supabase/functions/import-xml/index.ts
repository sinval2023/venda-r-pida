import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ImportType = "products" | "clients";

type ImportRequest = {
  type: ImportType;
  xml: string;
};

type ProductRow = { code: string; description: string; default_price: number };

type ClientRow = { cpf: string; name: string };

const getEnv = (key: string) => {
  const v = Deno.env.get(key);
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
};

function parseRowAttributes(rowTag: string) {
  const attrs: Record<string, string> = {};
  // matches key="value" and key='value'
  const re = /([A-Za-z0-9_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rowTag))) {
    const key = m[1];
    const val = (m[2] ?? m[3] ?? "").trim();
    attrs[key] = val;
  }
  return attrs;
}

function pickAttr(attrs: Record<string, string>, names: string[]) {
  const lower = new Map(Object.entries(attrs).map(([k, v]) => [k.toLowerCase(), v]));
  for (const n of names) {
    const v = lower.get(n.toLowerCase());
    if (v !== undefined) return v;
  }
  return "";
}

function parsePrice(priceStr: string) {
  const cleaned = (priceStr ?? "0").toString().trim().replace(",", ".");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function extractProductsFromBarrasXml(xml: string): ProductRow[] {
  // Fast path for DATAPACKET-like XML: <ROW ... />
  const rows: ProductRow[] = [];
  const rowTags = xml.match(/<ROW\b[^>]*>/gi) ?? [];

  for (const rowTag of rowTags) {
    const attrs = parseRowAttributes(rowTag);
    const code = pickAttr(attrs, ["CODIGO", "COD_BARRA", "CODBARRA", "CODE"]);
    const description = pickAttr(attrs, ["DESCRICAO", "DESCR", "DESCRIPTION", "NOME"]);
    const priceStr = pickAttr(attrs, ["PRECO_VENDA", "PRECO", "VALOR", "PRICE"]);

    if (code && description) {
      rows.push({
        code: code.trim(),
        description: description.trim().toUpperCase(),
        default_price: parsePrice(priceStr),
      });
    }
  }

  if (rows.length > 0) return rows;

  // Fallback: very simple <produto>...</produto> extraction
  const produtoBlocks = xml.match(/<(produto|PRODUTO)\b[^>]*>[\s\S]*?<\/(produto|PRODUTO)>/g) ?? [];
  for (const block of produtoBlocks) {
    const code = (block.match(/<(codigo|CODIGO)>([\s\S]*?)<\/(codigo|CODIGO)>/i)?.[2] ?? "").trim();
    const description =
      (block.match(/<(descricao|DESCRICAO|nome|NOME)>([\s\S]*?)<\/(descricao|DESCRICAO|nome|NOME)>/i)?.[2] ?? "").trim();
    const priceStr =
      (block.match(/<(preco|PRECO|valor|VALOR)>([\s\S]*?)<\/(preco|PRECO|valor|VALOR)>/i)?.[2] ?? "0").trim();

    if (code && description) {
      rows.push({
        code,
        description: description.toUpperCase(),
        default_price: parsePrice(priceStr),
      });
    }
  }

  return rows;
}

function extractClientsFromXml(xml: string): ClientRow[] {
  const rows: ClientRow[] = [];

  const clienteBlocks = xml.match(/<(cliente|CLIENTE)\b[^>]*>[\s\S]*?<\/(cliente|CLIENTE)>/g) ?? [];
  for (const block of clienteBlocks) {
    const nome = (block.match(/<(nome|NOME)>([\s\S]*?)<\/(nome|NOME)>/i)?.[2] ?? "").trim();
    const cpf = (block.match(/<(cpf|CPF)>([\s\S]*?)<\/(cpf|CPF)>/i)?.[2] ?? "").trim();

    if (cpf && nome) {
      rows.push({ cpf, name: nome.toUpperCase() });
    }
  }

  // fallback: <Client> style
  const clientBlocks = xml.match(/<(client|CLIENT)\b[^>]*>[\s\S]*?<\/(client|CLIENT)>/g) ?? [];
  for (const block of clientBlocks) {
    const nome = (block.match(/<(nome|name|NOME|NAME)>([\s\S]*?)<\/(nome|name|NOME|NAME)>/i)?.[2] ?? "").trim();
    const cpf = (block.match(/<(cpf|CPF)>([\s\S]*?)<\/(cpf|CPF)>/i)?.[2] ?? "").trim();

    if (cpf && nome) {
      rows.push({ cpf, name: nome.toUpperCase() });
    }
  }

  return rows;
}

async function requireAuthenticatedUser(req: Request) {
  const supabaseUrl = getEnv("SUPABASE_URL");
  const anonKey = getEnv("SUPABASE_ANON_KEY");

  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader) throw new Error("Unauthorized");

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) throw new Error("Unauthorized");

  return data.user;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    await requireAuthenticatedUser(req);

    const body: ImportRequest = await req.json();
    if (!body?.type || !body?.xml) {
      return new Response(JSON.stringify({ success: false, error: "Payload inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = getEnv("SUPABASE_URL");
    const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    if (body.type === "products") {
      const products = extractProductsFromBarrasXml(body.xml);
      if (products.length === 0) {
        return new Response(JSON.stringify({ success: false, error: "Nenhum produto válido encontrado no XML." }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const chunkSize = 500;
      for (let i = 0; i < products.length; i += chunkSize) {
        const chunk = products.slice(i, i + chunkSize);
        const { error } = await admin.from("products").upsert(chunk, { onConflict: "code" });
        if (error) throw error;
      }

      return new Response(JSON.stringify({ success: true, type: "products", total: products.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.type === "clients") {
      const clients = extractClientsFromXml(body.xml);
      if (clients.length === 0) {
        return new Response(JSON.stringify({ success: false, error: "Nenhum cliente válido encontrado no XML." }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const chunkSize = 500;
      for (let i = 0; i < clients.length; i += chunkSize) {
        const chunk = clients.slice(i, i + chunkSize);
        const { error } = await admin.from("clients").upsert(chunk, { onConflict: "cpf" });
        if (error) throw error;
      }

      return new Response(JSON.stringify({ success: true, type: "clients", total: clients.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Tipo inválido" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro inesperado";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: message === "Unauthorized" ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
