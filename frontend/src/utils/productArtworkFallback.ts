export function getProductArtworkFallback(name: string, category: string) {
  const seed = [...`${name}-${category}`].reduce(
    (value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0,
    2166136261,
  );
  const hue = 205 + (seed % 115);
  const safeName = name.replace(/[<>&"]/g, "");
  const safeCategory = category.replace(/[<>&"]/g, "").replaceAll("-", " ").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><defs><linearGradient id="b" x2="1" y2="1"><stop stop-color="hsl(${hue} 48% 16%)"/><stop offset="1" stop-color="#080808"/></linearGradient></defs><rect width="800" height="800" rx="48" fill="url(#b)"/><circle cx="670" cy="120" r="220" fill="#eab308" opacity=".16"/><rect x="120" y="175" width="560" height="360" rx="32" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="8"/><path d="M205 285h390M205 365h300M205 445h350" stroke="#fff" stroke-opacity=".7" stroke-width="22" stroke-linecap="round"/><text x="64" y="650" fill="#fff" font-family="Arial,sans-serif" font-size="42" font-weight="700">${safeName}</text><text x="66" y="700" fill="#eab308" font-family="Arial,sans-serif" font-size="18" font-weight="700" letter-spacing="3">${safeCategory}</text></svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
