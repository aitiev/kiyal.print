// Shared logo artwork. `pad` shrinks the art for maskable safe zone.
export function logoSvg({ size = 512, pad = 0, rounded = true } = {}) {
  const s = 512
  const k = 1 - pad * 2
  const off = (s * pad)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${rounded ? 112 : 0}" fill="#FFF1E3"/>
  <g transform="translate(${off} ${off}) scale(${k})">
    <circle cx="256" cy="256" r="196" fill="#FFD8C2"/>
    <path d="M256 168 C210 140 150 138 104 152 L104 360 C150 346 210 348 256 376 Z" fill="#FFFFFF" stroke="#4A3B52" stroke-width="16" stroke-linejoin="round"/>
    <path d="M256 168 C302 140 362 138 408 152 L408 360 C362 346 302 348 256 376 Z" fill="#CDEFE2" stroke="#4A3B52" stroke-width="16" stroke-linejoin="round"/>
    <circle cx="166" cy="236" r="26" fill="#FF9F7A"/>
    <circle cx="196" cy="298" r="18" fill="#C9B8F2"/>
    <path d="M330 206 l12 24 26 4 -19 18 5 26 -24 -12 -24 12 5 -26 -19 -18 26 -4z" fill="#FFC857" stroke="#4A3B52" stroke-width="8" stroke-linejoin="round"/>
    <rect x="300" y="300" width="70" height="20" rx="10" fill="#C9B8F2"/>
  </g>
</svg>`
}
