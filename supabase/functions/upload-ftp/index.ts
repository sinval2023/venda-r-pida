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
  content: string;
  filename: string;
  ftpConfig: FTPConfig;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, filename, ftpConfig }: UploadRequest = await req.json();

    console.log(`Attempting FTP upload to ${ftpConfig.host}:${ftpConfig.port}${ftpConfig.folder}/${filename}`);

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
      throw new Error("FTP login failed: " + passResp);
    }

    // Change to target directory
    if (ftpConfig.folder && ftpConfig.folder !== "/") {
      const cwdResp = await sendCommand(`CWD ${ftpConfig.folder}`);
      console.log("CWD response:", cwdResp);
    }

    // Set binary mode
    await sendCommand("TYPE I");

    // Enter passive mode
    const pasvResp = await sendCommand("PASV");
    console.log("PASV response:", pasvResp);
    
    // Parse PASV response to get data connection details
    const pasvMatch = pasvResp.match(/\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/);
    if (!pasvMatch) {
      throw new Error("Failed to parse PASV response: " + pasvResp);
    }
    
    const dataHost = `${pasvMatch[1]}.${pasvMatch[2]}.${pasvMatch[3]}.${pasvMatch[4]}`;
    const dataPort = parseInt(pasvMatch[5]) * 256 + parseInt(pasvMatch[6]);

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
    const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar arquivo via FTP';
    console.error('FTP upload error:', errorMessage);
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
