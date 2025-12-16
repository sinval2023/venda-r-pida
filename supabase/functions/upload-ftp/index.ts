import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FTPConfig {
  host: string;
  user: string;
  password: string;
  port: number;
  folder: string;
}

interface UploadRequest {
  content?: string;
  filename?: string;
  ftpConfig: FTPConfig;
  testOnly?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, filename, ftpConfig, testOnly }: UploadRequest = await req.json();

    console.log(`${testOnly ? 'Testing' : 'Uploading to'} FTP: ${ftpConfig.host}:${ftpConfig.port}${ftpConfig.folder}`);

    // Connect to FTP server using Deno's TCP connection
    const conn = await Deno.connect({
      hostname: ftpConfig.host,
      port: ftpConfig.port,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Helper to read response
    const readResponse = async (): Promise<string> => {
      const buf = new Uint8Array(1024);
      const n = await conn.read(buf);
      if (n === null) throw new Error("Connection closed");
      return decoder.decode(buf.subarray(0, n)).trim();
    };

    // Helper to send command
    const sendCommand = async (cmd: string): Promise<string> => {
      await conn.write(encoder.encode(cmd + "\r\n"));
      return await readResponse();
    };

    // Read welcome message
    const welcome = await readResponse();
    console.log("FTP Welcome:", welcome);

    // Login
    const userResp = await sendCommand(`USER ${ftpConfig.user}`);
    console.log("USER response:", userResp);
    
    const passResp = await sendCommand(`PASS ${ftpConfig.password}`);
    console.log("PASS response:", passResp);
    
    if (!passResp.startsWith("230")) {
      throw new Error("Login falhou: usuário ou senha incorretos");
    }

    // Change to target directory
    if (ftpConfig.folder && ftpConfig.folder !== "/") {
      const cwdResp = await sendCommand(`CWD ${ftpConfig.folder}`);
      console.log("CWD response:", cwdResp);
      if (!cwdResp.startsWith("250")) {
        throw new Error(`Pasta '${ftpConfig.folder}' não encontrada`);
      }
    }

    // If test only, quit here
    if (testOnly) {
      await sendCommand("QUIT");
      conn.close();
      console.log("FTP connection test successful");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Conexão estabelecida com sucesso em ${ftpConfig.host}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Set binary mode
    await sendCommand("TYPE I");

    // Prefer EPSV (works better with NAT) and fallback to PASV
    let dataHost = ftpConfig.host;
    let dataPort: number | null = null;

    const epsvResp = await sendCommand("EPSV");
    console.log("EPSV response:", epsvResp);

    const epsvMatch = epsvResp.match(/\(\|\|\|(\d+)\|\)/);
    if (epsvResp.startsWith("229") && epsvMatch) {
      dataPort = parseInt(epsvMatch[1]);
    }

    if (!dataPort) {
      const pasvResp = await sendCommand("PASV");
      console.log("PASV response:", pasvResp);

      const pasvMatch = pasvResp.match(/\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/);
      if (!pasvMatch) {
        throw new Error("Failed to parse PASV response: " + pasvResp);
      }

      const respHost = `${pasvMatch[1]}.${pasvMatch[2]}.${pasvMatch[3]}.${pasvMatch[4]}`;
      dataPort = parseInt(pasvMatch[5]) * 256 + parseInt(pasvMatch[6]);

      // Many servers behind NAT return a private IP in PASV; use the original FTP host instead
      console.log("PASV provided host:", respHost, "| Using host:", dataHost, "| Data port:", dataPort);
    }

    // Connect to data port
    const dataConn = await Deno.connect({
      hostname: dataHost,
      port: dataPort,
    });

    // Send STOR command
    const storResp = await sendCommand(`STOR ${filename}`);
    console.log("STOR response:", storResp);

    if (!storResp.startsWith("150") && !storResp.startsWith("125")) {
      dataConn.close();
      throw new Error("Failed to initiate file transfer: " + storResp);
    }

    // Send file content
    await dataConn.write(encoder.encode(content));
    dataConn.close();

    // Read transfer complete response
    const transferResp = await readResponse();
    console.log("Transfer response:", transferResp);

    // Quit
    await sendCommand("QUIT");
    conn.close();

    console.log("FTP upload successful");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Arquivo ${filename} enviado com sucesso para ${ftpConfig.host}${ftpConfig.folder}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao conectar com servidor FTP';
    console.error('FTP error:', errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
