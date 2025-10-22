# CanEditor Original

Local dev: npm install && npm run dev, then open http://localhost:3000

## Default Settings
The initial defaults for lighting, bar highlight, camera FOV, label roughness, and metal colors live in `src/app/page.tsx`.

- Label roughness: `0.21`
- Camera FOV: `10`
- Bar Light: enabled, color `#fafafa`, intensity `1.10`, rotation `360°`, y `-1.91`, distance `3.6`, width `10.1`, height `11.1`
- Other Lights: strength `1.61×`, rotation `130°`, ambient `2.7`, fill `4.3`, rim `5.6`, directional `4.2`, base env intensity `2.32`, directional position `[1000, 500, 500]`
- Metal:
  - Top: color `#c7c7c7`, roughness `0.48`, brightness `1.35`, emissive `0.01`, receiveShadow ✅
  - Bottom: color `#b8b8b8`, roughness `0.46`, brightness `1.40`, emissive `0.01`, receiveShadow ✅

"Reset to Default" uses the same values.

To change these later, edit the corresponding `useState` initializers and the `resetToDefault` function in `src/app/page.tsx`.
