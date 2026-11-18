import fs from 'node:fs/promises';
const output = new URL('../build/', import.meta.url);
await fs.mkdir(output, { recursive: true });
await fs.cp(new URL('../dist/', import.meta.url), output, { recursive: true });
await fs.writeFile(new URL('.nojekyll', output), '');
await fs.access(new URL('index.html', output));
await fs.access(new URL('app/index.html', output));
console.log('Сайт подготовлен: build/ — лендинг, build/app/ — приложение.');
