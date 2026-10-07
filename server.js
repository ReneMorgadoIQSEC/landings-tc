import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import compression from 'compression';
import express from 'express';

const ROOT = import.meta.dirname;
const PORT = process.env.PORT || 3000;
const LANDINGS_DIR = 'buen-fin';

// Los HTML usan rutas relativas (../../assets) y el CSS rutas absolutas (/assets/fonts),
// por eso los recursos deben vivir en la raíz del dominio.
const RESOURCES = ['assets', 'js', 'styles'];

const app = express();

app.disable('x-powered-by');
app.use(compression());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

for (const dir of RESOURCES) {
  app.use(`/${dir}`, express.static(join(ROOT, dir), { maxAge: '1h' }));
}

app.use(
  `/${LANDINGS_DIR}`,
  express.static(join(ROOT, LANDINGS_DIR), {
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  })
);

app.get(['/', `/${LANDINGS_DIR}`], (_req, res) => {
  const items = listLandings()
    .map((name) => `<li><a href="/${LANDINGS_DIR}/${name}/">${name}</a></li>`)
    .join('');

  res.send(`<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Landings Buen Fin</title></head>
<body style="font-family: system-ui, sans-serif; padding: 2rem;">
  <h1>Landings Buen Fin</h1>
  <ul>${items}</ul>
</body>
</html>`);
});

app.use((_req, res) => res.status(404).send('Página no encontrada'));

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

function listLandings() {
  return readdirSync(join(ROOT, LANDINGS_DIR), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(ROOT, LANDINGS_DIR, entry.name, 'index.html')))
    .map((entry) => entry.name)
    .sort();
}
