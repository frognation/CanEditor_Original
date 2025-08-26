const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const flavorTextures = {
  lemonLime: `${BASE}/labels/lemon-lime.png`,
  grape: `${BASE}/labels/grape.png`,
  strawberryLemonade: `${BASE}/labels/strawberry.png`,
  watermelon: `${BASE}/labels/watermelon.png`,
} as const;
