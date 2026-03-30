import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startDevServer() {
  const server = await createServer({
    root: __dirname,
    server: {
      port: 3000,
      host: true
    }
  });

  await server.listen();
  
  console.log('Dev server running at http://localhost:3000');
  console.log('- Public: http://localhost:3000/');
  console.log('- Admin: http://localhost:3000/admin');
}

startDevServer().catch(console.error);
