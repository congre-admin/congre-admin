import { createServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certPath = path.resolve(__dirname, 'vite-cert.pem');
const keyPath = path.resolve(__dirname, 'vite-key.pem');
const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

async function startDevServer() {
  const server = await createServer({
    root: __dirname,
    server: {
      port: 3000,
      host: true,
      ...(hasCerts ? {
        https: {
          cert: fs.readFileSync(certPath),
          key: fs.readFileSync(keyPath),
        },
      } : {}),
    }
  });

  await server.listen();
  
  const protocol = hasCerts ? 'https' : 'http';
  console.log(`Dev server running at ${protocol}://localhost:3000`);
  console.log(`- Public: ${protocol}://localhost:3000/`);
  console.log(`- Admin: ${protocol}://localhost:3000/admin`);
}

startDevServer().catch(console.error);
