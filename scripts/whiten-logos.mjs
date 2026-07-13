import sharp from "sharp";
import path from "node:path";

// Logos that ship with an opaque (white) background. brightness(0) in CSS would
// turn that whole rectangle black, so knock the near-white pixels out to
// transparent first. Content stays; only the paper-white background is removed.
const targets = ["westpac", "allianz", "qantas", "bupa"];
const dir = "public/logos";
const T = 236; // treat r,g,b all >= T as background white

for (const n of targets) {
  const p = path.join(dir, `${n}.png`);
  const { data, info } = await sharp(p)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    if (data[i] >= T && data[i + 1] >= T && data[i + 2] >= T) {
      data[i + 3] = 0;
    }
  }
  await sharp(data, { raw: { width, height, channels } })
    .png()
    .toFile(`${dir}/${n}.tmp.png`);
  // replace original
  const fs = await import("node:fs/promises");
  await fs.rename(`${dir}/${n}.tmp.png`, p);
  console.log(`whitened ${n}`);
}
