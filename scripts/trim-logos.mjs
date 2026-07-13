import sharp from "sharp";
import { readdir } from "node:fs/promises";
import path from "node:path";

const dir = "public/logos";
const files = (await readdir(dir)).filter((f) => f.endsWith(".png"));

for (const f of files) {
  const p = path.join(dir, f);
  // Trim uniform border (transparent or white) so every logo has a tight box.
  const buf = await sharp(p).trim({ threshold: 12 }).toBuffer();
  await sharp(buf).png().toFile(p);
  const m = await sharp(p).metadata();
  console.log(`${f.padEnd(16)} ${m.width}x${m.height}  ratio ${(m.width / m.height).toFixed(2)}`);
}
