#!/usr/bin/env node
/* Reports which WebGL renderer headless Chrome gets with each launch mode, so you can see whether
   renders run on the real GPU (Apple/Metal) or on the slow software fallback (SwiftShader).
     node tools/gpu-check.mjs */
import puppeteer from "puppeteer";

const base = ["--hide-scrollbars", "--mute-audio", "--force-color-profile=srgb"];
const modes = {
  "shell (old default)": { headless: "shell", args: base },
  "shell + metal": { headless: "shell", args: [...base, "--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] },
  "new headless + metal": { headless: true, args: [...base, "--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] },
};

for (const [label, o] of Object.entries(modes)) {
  let browser;
  try {
    browser = await puppeteer.launch(o);
    const page = await browser.newPage();
    const r = await page.evaluate(() => {
      const gl = document.createElement("canvas").getContext("webgl2");
      if (!gl) return { webgl2: false };
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      return { webgl2: true, renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
               maxTexture: gl.getParameter(gl.MAX_TEXTURE_SIZE), webgpu: !!navigator.gpu };
    });
    console.log(label.padEnd(24), JSON.stringify(r));
  } catch (e) { console.log(label.padEnd(24), "failed:", e.message); }
  finally { await browser?.close(); }
}
