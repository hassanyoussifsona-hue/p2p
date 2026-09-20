import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import QRCode from 'qrcode';
import { defineConfig, type Plugin } from 'vite';

function documentApiPlugin(): Plugin {
  return {
    name: 'document-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/document-meta') && req.method === 'GET') {
          const metaPath = path.resolve(__dirname, 'public/document_meta.json');
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          if (fs.existsSync(metaPath)) {
            try {
              const metaContent = fs.readFileSync(metaPath, 'utf8');
              return res.end(metaContent);
            } catch {}
          }
          return res.end(
            JSON.stringify({
              isDefault: true,
              fileName: 'ADIB_No_Liability_Certificate.jpg',
              title: 'شهادة براءة ذمة - مصرف أبوظبي الإسلامي',
              fileType: 'image',
              totalPages: 1,
              pages: ['/44.jpg'],
              originalPdf: '/Mohamed_Abdulla_Verfication.pdf',
              updatedAt: Date.now(),
            })
          );
        }

        if (req.url?.startsWith('/api/upload-document') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body);
              const { fileName, fileData, fileType } = data;
              const buffer = Buffer.from(fileData.split(',').pop() || fileData, 'base64');
              const isPdf = fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');

              if (isPdf) {
                // Save original PDF for download/printing
                const pdfPath = path.resolve(__dirname, 'public/uploaded_doc.pdf');
                fs.writeFileSync(pdfPath, buffer);

                // Clean old converted pages
                const publicDir = path.resolve(__dirname, 'public');
                const oldPages = fs.readdirSync(publicDir).filter((f) => f.startsWith('doc_page_'));
                for (const f of oldPages) {
                  try {
                    fs.unlinkSync(path.join(publicDir, f));
                  } catch {}
                }

                // High-resolution Ghostscript/ImageMagick rasterization (200 DPI = ~1654x2339 per A4 page)
                // This locks in every Arabic ligature, prevents font separation, and preserves exact signature metrics
                const outputPrefix = path.join(publicDir, 'doc_page_');
                try {
                  execSync(`convert -density 200 "${pdfPath}" -quality 100 "${outputPrefix}%d.png"`);
                } catch (convErr) {
                  console.error('PDF raster conversion error:', convErr);
                }

                const pageFiles = fs
                  .readdirSync(publicDir)
                  .filter((f) => f.startsWith('doc_page_') && f.endsWith('.png'))
                  .sort((a, b) => {
                    const numA = parseInt(a.replace('doc_page_', '').replace('.png', ''), 10) || 0;
                    const numB = parseInt(b.replace('doc_page_', '').replace('.png', ''), 10) || 0;
                    return numA - numB;
                  })
                  .map((f) => `/${f}`);

                // Also copy page 0 as 44.jpg for instant fallback
                if (pageFiles.length > 0) {
                  try {
                    execSync(`convert "${path.join(publicDir, pageFiles[0].slice(1))}" -quality 95 "${path.join(publicDir, '44.jpg')}"`);
                  } catch {}
                }

                const meta = {
                  isDefault: false,
                  fileName: fileName,
                  title: fileName.replace(/\.[^/.]+$/, ''),
                  fileType: 'pdf',
                  totalPages: pageFiles.length || 1,
                  pages: pageFiles.length > 0 ? pageFiles : ['/44.jpg'],
                  originalPdf: '/uploaded_doc.pdf',
                  updatedAt: Date.now(),
                };

                fs.writeFileSync(path.join(publicDir, 'document_meta.json'), JSON.stringify(meta, null, 2));
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: true, meta }));
              } else {
                // It's an image
                const ext = path.extname(fileName) || '.png';
                const publicDir = path.resolve(__dirname, 'public');
                const imgPath = path.join(publicDir, `uploaded_doc${ext}`);
                fs.writeFileSync(imgPath, buffer);

                // Overwrite 44.jpg and 11.png as the master image
                try {
                  execSync(`convert "${imgPath}" -quality 95 "${path.join(publicDir, '44.jpg')}"`);
                  execSync(`convert "${imgPath}" "${path.join(publicDir, '11.png')}"`);
                  execSync(`convert "${imgPath}" -page 1240x1754 "${path.join(publicDir, 'Mohamed_Abdulla_Verfication.pdf')}"`);
                } catch (imgErr) {
                  console.error('Image sync error:', imgErr);
                }

                const meta = {
                  isDefault: false,
                  fileName: fileName,
                  title: fileName.replace(/\.[^/.]+$/, ''),
                  fileType: 'image',
                  totalPages: 1,
                  pages: [`/uploaded_doc${ext}`],
                  originalPdf: '/Mohamed_Abdulla_Verfication.pdf',
                  updatedAt: Date.now(),
                };

                fs.writeFileSync(path.join(publicDir, 'document_meta.json'), JSON.stringify(meta, null, 2));
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: true, meta }));
              }
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: err?.message || 'Upload failed' }));
            }
          });
          return;
        }

        if (req.url?.startsWith('/api/update-document-qr') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { url, color } = JSON.parse(body);
              if (!url) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: 'URL is required' }));
              }
              const publicDir = path.resolve(__dirname, 'public');
              const qrTemp = path.join('/tmp', `live_qr_${Date.now()}.png`);
              await QRCode.toFile(qrTemp, url, {
                width: 204,
                margin: 1,
                errorCorrectionLevel: 'H',
                color: { dark: color || '#002b49', light: '#ffffff' },
              });

              // Composite onto 44.jpg and 11.png
              const masterJpg = path.join(publicDir, '44.jpg');
              const masterPng = path.join(publicDir, '11.png');
              if (fs.existsSync(masterJpg)) {
                try {
                  execSync(`composite -geometry +506+911 "${qrTemp}" "${masterJpg}" "${masterJpg}"`);
                } catch (e) {
                  console.error('Failed composite 44.jpg:', e);
                }
              }
              if (fs.existsSync(masterPng)) {
                try {
                  execSync(`composite -geometry +506+911 "${qrTemp}" "${masterPng}" "${masterPng}"`);
                  execSync(`convert "${masterPng}" -page 1240x1754 "${path.join(publicDir, 'Mohamed_Abdulla_Verfication.pdf')}"`);
                  execSync(`convert "${masterPng}" -page 1240x1754 "${path.join(publicDir, 'adib_certificate.pdf')}"`);
                } catch (e) {
                  console.error('Failed composite 11.png / pdf:', e);
                }
              }

              // Update document_meta.json
              const metaPath = path.join(publicDir, 'document_meta.json');
              let meta: any = {};
              if (fs.existsSync(metaPath)) {
                try {
                  meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
                } catch {}
              }
              meta.currentQrUrl = url;
              meta.updatedAt = Date.now();
              fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, qrUrl: url, meta }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ error: err?.message || 'Failed to update QR' }));
            }
          });
          return;
        }

        if (req.url?.startsWith('/api/reset-document') && req.method === 'POST') {
          const publicDir = path.resolve(__dirname, 'public');
          const meta = {
            isDefault: true,
            fileName: 'ADIB_No_Liability_Certificate.jpg',
            title: 'شهادة براءة ذمة - مصرف أبوظبي الإسلامي',
            fileType: 'image',
            totalPages: 1,
            pages: ['/44.jpg'],
            originalPdf: '/Mohamed_Abdulla_Verfication.pdf',
            updatedAt: Date.now(),
          };
          fs.writeFileSync(path.join(publicDir, 'document_meta.json'), JSON.stringify(meta, null, 2));
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ success: true, meta }));
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), documentApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
