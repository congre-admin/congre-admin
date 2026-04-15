import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

const certPath = path.resolve(__dirname, 'vite-cert.pem');
const keyPath = path.resolve(__dirname, 'vite-key.pem');

export default defineConfig({
    base: '/',
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 3000,
        host: true,
        https: fs.existsSync(certPath) && fs.existsSync(keyPath) ? {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
        } : true,
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
});