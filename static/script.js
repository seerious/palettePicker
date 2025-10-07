function normalizeHex(hex) {
    if (!hex) return "#000000";
    hex = hex.trim();
    if (hex[0] === "#") hex = hex.slice(1);
    if (hex.length === 3) {
        hex = hex.split("").map(c => c + c).join("");
    }
    if (hex.length !== 6) return "000000";
    return "#" + hex.toLowerCase();
}

function hexToRGB(hex) {
    hex = normalizeHex(hex).slice(1);
    const bigInt = parseInt(hex, 16);
    const r = (bigInt >> 16) & 255;
    const g = (bigInt >> 8) & 255;
    const b = bigInt & 255;
    return {r, g, b}
}

function rgbToHex(r, g, b) {
    const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
    return "#" + ((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b)).toString(16).slice(1).toLowerCase();
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s;
    const l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }
    return {h:Math.round(h * 360), s: +(s * 100).toFixed(1), l: +(l * 100).toFixed(1)}
}

function hslToRGB(h, s, l) {
    h = h % 360;
    if (h < 0) {
        h += 360
    }
    s /= 100; l /= 100;

    if (s === 0) {
        const val = Math.round(l * 255);
        return {r: val, g: val, b: val}
    }

    function hueToRGB(p, q, t) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hk = h / 360;
    const r = Math.round(hueToRGB(p, q, hk + 1/3) * 255);
    const g = Math.round(hueToRGB(p, q, hk) * 255);
    const b = Math.round(hueToRGB(p, q, hk - 1/3) * 255);
    return {r, g, b};
}

function hslToHex(h, s, l) {
    const {r, g, b} = hslToRGB(h, s, l);
    return rgbToHex(r,g, b);
}

function generateComplementary(baseHex, count = 5) {
    const baseHsl = rgbToHsl(...Object.values(hexToRGB(baseHex)));
    const complementHue = (baseHsl.h + 180) % 360;
    const colors = [];
    for (let i =0; i < count; i++) {
        const t = i / (count - 1 || 1);
        const hue = Math.round(baseHsl.h + (complementHue - baseHsl.h) * t);
        const lightness = Math.round(Math.max(8, Math.min(92, baseHsl.l + (t - 0.5) * 18)));
        const sat = Math.round(Math.max(8, Math.min(96, baseHsl.s)));
        colors.push(hslToHex(hue, baseHsl.s, lightness));
    }
    return colors;
}

function generateAnalogous(baseHex, count = 5) {
  const baseHsl = rgbToHsl(...Object.values(hexToRGB(baseHex)));
  const spread = 30; // degrees on each side
  const colors = [];
  for (let i = 0; i < count; i++) {
    const t = (count === 1) ? 0.5 : i / (count - 1);
    const hue = Math.round(baseHsl.h + (t - 0.5) * 2 * spread);
    const lightness = Math.round(Math.max(6, Math.min(94, baseHsl.l + (t - 0.5) * 12)));
    colors.push(hslToHex(hue, baseHsl.s, lightness));
  }
  return colors;
}

function generateTriadic(baseHex, count=3) {
    baseHsl = rgbToHsl(...Object.values(hexToRGB(baseHex)));
    const triads = [baseHsl.h, (baseHsl.h + 120) % 360, (baseHsl.h + 240) % 360];
    const colors = [];

    for (let i = 0; i < count; i++) {
        const index = i % 3;
        const step = Math.floor(i / 3);
        const lightness = Math.round(Math.max(6, Math.min(94, baseHsl.l + (step * 6))));
        colors.push(hslToHex(triads[index], baseHsl.s, lightness));
    }
    return colors;
}

function generateMonochrome(baseHex, count = 5) {
    const baseHsl = rgbToHsl(...Object.values(hexToRGB(baseHex)));
    const colors = [];
    const minL = 6, maxL = 94;
    
    for (let i = 0; i < count; i++) {
        const t = i / Math.max(1, count - 1);
        const l = Math.round(minL + (maxL - minL) * t);
        colors.push(hslToHex(baseHsl.h, baseHsl.s, l));
    }
    return colors;
}

function generateGradient(baseHex, count = 2) {
    const baseHsl = rgbToHex(...Object.values(hexToRGB(baseHex)));
    const partnerHue = (baseHsl.h + (baseHsl.l > 50 ? -24 : 24) + 360) % 360;
    const partnerL = Math.max(6, Math.min(94, baseHsl.l + (baseHsl > 50 ? -12 : 12)));
    const start = baseHex;
    const end = hslToHex(partnerHue, baseHsl.s, partnerL);

    const startRgb = hexToRGB(start);
    const endRgb = hexToRGB(end);
    const stops = [];

    for (let i = 0; i < count; i++) {
        const t = i / Math.max(1, count - 1);
        const r = Math.round(startRgb.r + (endRgb.r - startRgb.r) * t);
        const g = Math.round(startRgb.g + (endRgb.g - startRgb.g) * t);
        const b = Math.round(startRgb.b + (endRgb.b - startRgb.b) * t);
        stops.push(rgbToHex(r, g, b));
    }
    return stops;
}

function generatePalette(type, baseHex, count) {
  switch (type) {
    case "complementary": return generateComplementary(baseHex, count);
    case "analogous": return generateAnalogous(baseHex, count);
    case "triadic": return generateTriadic(baseHex, count);
    case "monochrome": return generateMonochrome(baseHex, count);
    case "gradient": return generateGradient(baseHex, count);
    default: return generateComplementary(baseHex, count);
  }
}

document.addEventListener('DOMContentLoaded', () => {
    const baseColor = document.getElementById("baseColor");
    const baseHex = document.getElementById('baseHex');
    const paletteType = document.getElementById("paletteType");
    const countInput = document.getElementById("count");
    const generateBtn = document.getElementById("generate");
    const paletteE1 = document.getElementById("palette");
    const cssOutput = document.getElementById('cssOutput');
    const copyCssBtn = document.getElementById("copy");

    function syncFromColor() {
        baseHex.value = normalizeHex(baseColor.value);
    }

    function syncFromHex() {
        const norm = normalizeHex(baseHex.value);
        baseColor.value = norm;
        baseHex.value = norm;
    }

    baseColor.addEventListener("input", syncFromColor);
    baseHex.addEventListener("change", syncFromHex);

    function renderPalette() {
        const base = normalizeHex(baseHex.value);
        const type = paletteType.value;
        let count = parseInt(countInput.value, 10) || 5;
        count = Math.max(2, Math.min(8, count));
        const colors = generatePalette(type, base, count);

        const footer = document.getElementById("notes");
        if (baseHex.value === "#ffffff") {
            footer.innerHTML = `<p>Hello there Chloe!</p>`;
        } else {
            footer.innerHTML = `<p>Tip: click a color hex to copy it. Use the CSS variables button to copy variables for your stylesheet.</p>`
}

        paletteE1.innerHTML = "";
        colors.forEach((hex, i) => {
            const sw = document.createElement("div");
            sw.className = "swatch";

            if (type == "gradient") {
                const grad = `linear-gradient(90deg, ${colors[0]} 0%, ${colors[colors.length - 1]} 100%)`;
                sw.style.background = grad;
            } else {
                sw.style.background = hex;
            }

            const meta = document.createElement('div');
            meta.className = "meta";

            const nameSpan = document.createElement("span");
            nameSpan.className = "name";
            nameSpan.textContent = (type === 'gradient') ? `Stop ${i+1}` : `Colour ${i+1}`;

            const hexSpan = document.createElement("span");
            hexSpan.className = "hex";
            hexSpan.textContent = hex;
            hexSpan.title = "Click to copy";

            hexSpan.addEventListener('click', () => {
                navigator.clipboard.writeText(hex).then(() => {
                    hexSpan.textContent = "Copied!";
                    setTimeout(() => hexSpan.textContent = hex, 900);
                });
            });

            meta.appendChild(nameSpan);
            meta.appendChild(hexSpan);
            sw.appendChild(meta);
            paletteE1.appendChild(sw);
        });

        const vars = colors.map((c, idx) => `  --color-${idx+1}: ${c};`).join("\n");
        const css = `:root {\n${vars}\n}\n/* Palette: ${type} - base ${base} */`;
        cssOutput.value = css;
    }

    generateBtn.addEventListener("click", renderPalette);

    copyCssBtn.addEventListener("click", () => {
        const text = cssOutput.value;
        navigator.clipboard.writeText(text).then(() => {
            copyCssBtn.textContent = "Copied CSS";
            setTimeout(() => copyCssBtn.textContent = "Copy css value", 1000);
        });
    });

    syncFromColor();
    renderPalette();
});

