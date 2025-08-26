"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, useTexture, useGLTF, Lightformer } from "@react-three/drei";
import { flavorTextures } from "@/utils/data";
import { useState, useRef, useCallback, useEffect } from "react";
import * as THREE from "three";

useGLTF.preload("/Soda-can.gltf");

// 캔 사이즈 타입(위에서 먼저 선언)
type CanSize = "355ml" | "475ml";
interface CanSizeSpec {
  scale: [number, number, number];
  labelSizeText: string;
}

interface LightingSettings {
  // 전체 밝기(노출)
  exposure: number;
  envIntensity: number; // (bar 미사용시) base HDRI 강도
  ambientIntensity: number;
  fillLightIntensity: number;
  fillLightPosition: [number, number, number];
  rimLightIntensity: number;
  rimLightPosition: [number, number, number];
  directionalIntensity: number;
  directionalPosition: [number, number, number];
  otherRotation: number;   // 나머지 조명 회전
  otherStrength: number;   // 나머지 조명 전체 배율
}

// 바(하이라이트) 설정 타입(명시적으로 추가)
interface BarSettings {
  enabled: boolean;
  color: string;
  intensity: number;  // 0~20
  width: number;      // 0.1~12
  height: number;     // 0.1~16
  distance: number;   // 0.5~15
  rotation: number;   // 0~2π (바 전용 회전)
  y: number;          // -3~3
}

// 금속 파트 설정 추가
interface MetalPartSettings {
  color: string;
  brightness: number; // 0.5 ~ 2.0
  roughness: number;  // 0 ~ 1 (낮을수록 글로시)
  emissiveIntensity: number; // 0 ~ 2 (자체 발광으로 그림자 어두움 완화)
  castShadow: boolean;
  receiveShadow: boolean;
  envMapIntensity: number;   // 0 ~ 4 (환경/바 반사 강도)
}
interface MetalSettings {
  top: MetalPartSettings;
  bottom: MetalPartSettings;
}

const canSizeSpecs: Record<CanSize, CanSizeSpec> = {
  // 355ml: 지름은 동일, 전체 스케일 기본값
  "355ml": {
    scale: [2.5, 2.5, 2.5],
    // 지름 66mm → 둘레 ≈ 207mm, 라벨 높이 약 110mm
    labelSizeText: "Label 207×110 mm",
  },
  // 475ml: 동일 지름, 더 긴 높이 위주로 스케일
  "475ml": {
    scale: [2.6, 3.0, 2.6],
    // 지름 동일 → 둘레 ≈ 207mm, 라벨 높이 약 140mm
    labelSizeText: "Label 207×140 mm",
  },
};

function EditableSodaCan({
  customTexture,
  rotation,
  isAutoRotating,
  isRecording,
  recordingProgress,
  canSize,
  labelRoughness,
  metalSettings,
}: {
  customTexture?: string;
  rotation: [number, number, number];
  isAutoRotating: boolean;
  isRecording: boolean;
  recordingProgress: number;
  canSize: CanSize;
  labelRoughness: number;
  metalSettings: MetalSettings;
}) {
  const { nodes } = useGLTF("/Soda-can.gltf");
  const texture = useTexture(customTexture || flavorTextures.blackCherry);
  texture.flipY = false;

  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (isRecording) {
      groupRef.current.rotation.y = (recordingProgress / 100) * Math.PI * 2;
    } else if (isAutoRotating) {
      groupRef.current.rotation.y += delta * 0.5;
    } else {
      groupRef.current.rotation.set(...rotation);
    }
  });

  // 원본 지오메트리
  const metalGeo = (nodes.cylinder as THREE.Mesh).geometry as THREE.BufferGeometry;
  const labelGeo = (nodes.cylinder_1 as THREE.Mesh).geometry as THREE.BufferGeometry;

  // 라벨 바디 경계 (로컬)
  if (!labelGeo.boundingBox) labelGeo.computeBoundingBox();
  const bodyMinY = labelGeo.boundingBox!.min.y;
  const bodyMaxY = labelGeo.boundingBox!.max.y;
  const bodyHeight = bodyMaxY - bodyMinY;

  // 균일 그룹 스케일(지름만 조절)
  const uniformScale = 2.0; // X=Y=Z (기본 표시 크기 80%)
  // 475ml일 때 바디/라벨만 세로 확대
  const sy = canSize === "475ml" ? 3.0 / 2.5 : 1.0;

  // 상/하 경계 유격 제거 epsilon (로컬 단위, 475ml에서만 적용)
  const seamTopLocal   = sy > 1 ? bodyHeight * 0.003 : 0;  // 위쪽은 소폭
  const seamBottomLocal= sy > 1 ? bodyHeight * 0.007 : 0;  // 아래쪽은 더 크게

  // 중심 기준 신장량
  const offsetCoreLocal = (bodyHeight / 2) * (sy - 1);

  // 탑/바텀 이동량 (로컬 단위)
  const topOffsetLocal = offsetCoreLocal - seamTopLocal;
  const bottomOffsetLocal = offsetCoreLocal - seamBottomLocal;

  // 클리핑 경계(월드 단위)
  const newMinWorld = bodyMinY * sy * uniformScale;
  const newMaxWorld = bodyMaxY * sy * uniformScale;
  const seamTopWorld = seamTopLocal * sy * uniformScale;
  const seamBottomWorld = seamBottomLocal * sy * uniformScale;

  // 월드 기준 평면
  const planeKeepYGreaterEq = (y: number) => new THREE.Plane(new THREE.Vector3(0, 1, 0), -y); // y >= value
  const planeKeepYLessEq = (y: number) => new THREE.Plane(new THREE.Vector3(0, -1, 0), y);    // y <= value

  // 상단/하단 보정: 바닥을 더 끌어올림
  const topPlane = planeKeepYGreaterEq(newMaxWorld - seamTopWorld);
  const bottomPlane = planeKeepYLessEq(newMinWorld + seamBottomWorld);
  // 바디는 양쪽으로 확장
  const bodyPlanes = [
    planeKeepYGreaterEq(newMinWorld - seamBottomWorld),
    planeKeepYLessEq(newMaxWorld + seamTopWorld),
  ];

  // 재질
  const colorWithBrightness = (hex: string, b: number) => {
    const c = new THREE.Color(hex);
    c.multiplyScalar(b);
    return c;
  };
  const makeMetalMat = (planes: THREE.Plane[], part: "top" | "bottom" | "body") => {
    const cfg =
      part === "top"
        ? metalSettings.top
        : part === "bottom"
        ? metalSettings.bottom
        : {
            // 바디 금속은 상/하 평균값 적용
            color: "#bbbbbb",
            brightness: (metalSettings.top.brightness + metalSettings.bottom.brightness) / 2,
            roughness: (metalSettings.top.roughness + metalSettings.bottom.roughness) / 2,
            emissiveIntensity: (metalSettings.top.emissiveIntensity + metalSettings.bottom.emissiveIntensity) / 2,
            castShadow: false,
            receiveShadow: true,
            envMapIntensity: (metalSettings.top.envMapIntensity + metalSettings.bottom.envMapIntensity) / 2,
          };
    return new THREE.MeshStandardMaterial({
      roughness: cfg.roughness,
      metalness: 1,
      color: colorWithBrightness(cfg.color, cfg.brightness),
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: cfg.emissiveIntensity,
      envMapIntensity: cfg.envMapIntensity,
      clippingPlanes: planes,
      clipShadows: true,
    });
  };

  const topMetalMat = makeMetalMat([topPlane], "top");
  const bodyMetalMat = makeMetalMat(bodyPlanes, "body");
  const bottomMetalMat = makeMetalMat([bottomPlane], "bottom");

  return (
    <group ref={groupRef} dispose={null} scale={[uniformScale, uniformScale, uniformScale]}>
      {/* 상단 금속 */}
      <mesh
        castShadow={metalSettings.top.castShadow}
        receiveShadow={metalSettings.top.receiveShadow}
        geometry={metalGeo}
        material={topMetalMat}
        position-y={topOffsetLocal}
      />
      {/* 중앙 금속(바디) */}
      <mesh
        castShadow
        receiveShadow
        geometry={metalGeo}
        material={bodyMetalMat}
        scale={[1, sy, 1]}
      />
      {/* 하단 금속 */}
      <mesh
        castShadow={metalSettings.bottom.castShadow}
        receiveShadow={metalSettings.bottom.receiveShadow}
        geometry={metalGeo}
        material={bottomMetalMat}
        position-y={-bottomOffsetLocal}
      />

      {/* 라벨: z-fighting 방지 offset 강화 */}
      <mesh castShadow receiveShadow geometry={labelGeo} scale={[1, sy, 1]}>
        <meshStandardMaterial
          roughness={labelRoughness}
          metalness={0.7}
          map={texture}
          transparent
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>

      {/* 탭 */}
      <mesh
        castShadow
        receiveShadow
        geometry={(nodes.Tab as THREE.Mesh).geometry}
        position-y={topOffsetLocal}
      >
        <meshStandardMaterial
          roughness={metalSettings.top.roughness}
          metalness={1}
          color={colorWithBrightness(metalSettings.top.color, metalSettings.top.brightness)}
          emissive={"#ffffff"}
          emissiveIntensity={metalSettings.top.emissiveIntensity}
          envMapIntensity={metalSettings.top.envMapIntensity}
        />
      </mesh>
    </group>
  );
}

function CustomLighting({ settings }: { settings: LightingSettings }) {
  // otherStrength로 전체 배율을 곱함
  const k = settings.otherStrength;
  return (
    <group rotation-y={settings.otherRotation}>
      <ambientLight intensity={settings.ambientIntensity * k} />
      <directionalLight
        position={settings.directionalPosition}
        intensity={settings.directionalIntensity * k}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-radius={4}
      />
      <pointLight position={settings.fillLightPosition} intensity={settings.fillLightIntensity * k} color="#ffffff" />
      <pointLight position={settings.rimLightPosition} intensity={settings.rimLightIntensity * k} color="#ffffff" />
    </group>
  );
}

// 렌더러 노출(전체 밝기) 제어
function SceneExposure({ exposure }: { exposure: number }) {
  const { gl } = useThree();
  useFrame(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = exposure; // 0.0~4.0
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap; // 더 부드러운 그림자
  });
  return null;
}

// 카메라 원근 제어: FOV 변경 시 프레이밍 유지(기준 fov=25, z=4)
function CameraPerspective({ fov }: { fov: number }) {
  const { camera } = useThree();
  useEffect(() => {
    const persp = camera as THREE.PerspectiveCamera;
    const baseFov = 25; // Canvas 기본 fov
    const baseZ = 4;    // Canvas 기본 z
    const z =
      (baseZ * Math.tan(THREE.MathUtils.degToRad(baseFov / 2))) /
      Math.tan(THREE.MathUtils.degToRad(fov / 2));
    persp.fov = fov;
    persp.position.set(0, 0, z);
    persp.updateProjectionMatrix();
  }, [camera, fov]);
  return null;
}

// 바 하이라이트 전용 Environment + (bar 미사용시) 기본 HDRI
function RotatingEnvironment({
  barRotation,
  otherRotation,
  intensity = 1,
  bar,
}: {
  barRotation: number;
  otherRotation: number;
  intensity?: number;
  bar: BarSettings;
}) {
  if (bar.enabled) {
    return (
      <Environment resolution={1024}>
        <group rotation-y={barRotation}>
          <Lightformer
            color={bar.color}
            intensity={bar.intensity}
            position={[0, bar.y, bar.distance]}
            scale={[bar.width, bar.height, 1]}
          />
        </group>
      </Environment>
    );
  }
  return (
    <group rotation={[0, otherRotation, 0]}>
      <Environment preset="studio" />
    </group>
  );
}

function CustomOrbitControls({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  const [isInteracting, setIsInteracting] = useState(false);
  useFrame(() => {
    if (!isInteracting && controlsRef.current) {
      const currentPolar = controlsRef.current.getPolarAngle();
      const targetPolar = Math.PI / 2;
      const diff = targetPolar - currentPolar;
      if (Math.abs(diff) > 0.01) {
        controlsRef.current.setPolarAngle(currentPolar + diff * 0.1);
        controlsRef.current.update();
      }
    }
  });
  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom
      enableRotate
      minDistance={2}
      maxDistance={12}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={(Math.PI * 5) / 6}
      onStart={() => setIsInteracting(true)}
      onEnd={() => setIsInteracting(false)}
      enableDamping
      dampingFactor={0.05}
    />
  );
}

// 타입 선언 (누락 보완)
// type CanSize = "355ml" | "475ml";

// interface CanSizeSpec {
//   scale: [number, number, number];
//   labelSizeText: string;
// }

export default function Page() {
  const [selectedFlavor] = useState<keyof typeof flavorTextures>("blackCherry");
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0]);
  const [customImage, setCustomImage] = useState<string>("");
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [canSize, setCanSize] = useState<CanSize>("355ml");
  const [labelRoughness, setLabelRoughness] = useState<number>(0.26);
  const [metalSettings, setMetalSettings] = useState<MetalSettings>({
    top: { color: "#ffffff", brightness: 1.35, roughness: 0.48, emissiveIntensity: 0.01, castShadow: false, receiveShadow: true, envMapIntensity: 1.40 },
    bottom: { color: "#ffffff", brightness: 1.40, roughness: 0.46, emissiveIntensity: 0.01, castShadow: false, receiveShadow: true, envMapIntensity: 1.50 },
  });
  const [lightingSettings, setLightingSettings] = useState<LightingSettings>({
    exposure: 1.78,
    envIntensity: 1.54,                // (bar 비활성 시) HDRI 강도
    ambientIntensity: 2.8,
    fillLightIntensity: 5.0,
    fillLightPosition: [5, 0, 5],
    rimLightIntensity: 5.8,
    rimLightPosition: [-5, 0, 5],
    directionalIntensity: 2.6,
    directionalPosition: [10, 10, 10],
    otherRotation: (195 * Math.PI) / 180, // 195°
    otherStrength: 1.01,
  });
  const [bar, setBar] = useState<BarSettings>({
    enabled: true,
    color: "#fafafa",
    intensity: 1.10,
    width: 4.6,
    height: 10.8,
    distance: 3.5,
    rotation: Math.PI / 2, // 90°
    y: -2.83,
  });
  const [cameraFov, setCameraFov] = useState<number>(20);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const controlsRef = useRef<any>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setCustomImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const updateLightingSetting = (key: keyof LightingSettings, value: any) => {
    setLightingSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateMetalSetting = (
    part: "top" | "bottom",
    key: keyof MetalPartSettings,
    value: string | number | boolean
  ) => {
    setMetalSettings((prev) => ({
      ...prev,
      [part]: {
        ...prev[part],
        [key]: value as any,
      },
    }));
  };

  const resetToDefault = () => {
    setCustomImage("");
    setRotation([0, 0, 0]);
    setIsAutoRotating(false);
    setIsRecording(false);
    setRecordingProgress(0);
    setLabelRoughness(0.26);
    setCanSize("355ml");
    setMetalSettings({
      top: { color: "#ffffff", brightness: 1.35, roughness: 0.48, emissiveIntensity: 0.01, castShadow: false, receiveShadow: true, envMapIntensity: 1.40 },
      bottom: { color: "#ffffff", brightness: 1.40, roughness: 0.46, emissiveIntensity: 0.01, castShadow: false, receiveShadow: true, envMapIntensity: 1.50 },
    });
    setLightingSettings((prev) => ({
      ...prev,
      exposure: 1.78,
      envIntensity: 1.54,
      ambientIntensity: 2.8,
      fillLightIntensity: 5.0,
      rimLightIntensity: 5.8,
      directionalIntensity: 2.6,
      otherRotation: (195 * Math.PI) / 180,
      otherStrength: 1.01,
    }));
    setBar({
      enabled: true,
      color: "#fafafa",
      intensity: 1.10,
      width: 4.6,
      height: 10.8,
      distance: 3.5,
      rotation: Math.PI / 2,
      y: -2.83,
    });
    controlsRef.current?.reset();
    setCameraFov(20);
  };

  const toggleAutoRotation = () => setIsAutoRotating((v) => !v);

  // PNG 저장: 현재 캔버스 해상도 그대로, 배경 투명
  const saveToPNG = () => {
    const src = document.querySelector("canvas") as HTMLCanvasElement | null;
    if (!src) return;

    const link = document.createElement("a");
    link.download = `can-${canSize}.png`;
    link.href = src.toDataURL("image/png");
    link.click();
  };

  // 360 비디오 녹화: 현재 캔버스 해상도 그대로, 배경 투명, 속도 1/2(6초)
  const startVideoRecording = useCallback(() => {
    const src = document.querySelector("canvas") as HTMLCanvasElement | null;
    if (!src) return;

    setIsRecording(true);
    setRecordingProgress(0);

    const stream = src.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunks.push(ev.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `can-rotation-${canSize}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    };

    recorder.start();

    const duration = 6000; // 6초: 기존 대비 1/2 속도
    const start = performance.now();

    const tick = () => {
      const elapsed = performance.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setRecordingProgress(progress * 100);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        recorder.stop();
        setIsRecording(false);
        setRecordingProgress(0);
      }
    };

    requestAnimationFrame(tick);
  }, [canSize]);

  return (
    <div className="min-h-screen bg-white">
      <div className="flex h-screen">
        <div className="w-80 bg-gray-50 p-6 shadow-lg overflow-y-auto border-r">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Can Editor</h1>
              <p className="text-gray-600 text-sm">Customize and rotate your soda can</p>
            </div>

            {/* Can Size 선택 (상단 버튼) */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Can Size</h3>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(canSizeSpecs) as CanSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setCanSize(size)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      canSize === size ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold text-gray-800">{size}</div>
                    <div className="text-xs text-gray-500 mt-1">{canSizeSpecs[size].labelSizeText}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 라벨 질감 조절 */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Label Texture</h3>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Roughness: {labelRoughness.toFixed(2)} ({labelRoughness > 0.5 ? "Matte" : "Glossy"})
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={labelRoughness}
                onChange={(e) => setLabelRoughness(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* 금속(윗/아랫면) 설정 */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Metal (Top & Bottom)</h3>
              {/* Top */}
              <div className="bg-gray-50 p-3 rounded-lg mb-3">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Top Metal</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={metalSettings.top.color}
                      onChange={(e) => updateMetalSetting("top", "color", e.target.value)}
                      className="w-10 h-7 rounded border"
                    />
                    <input
                      type="text"
                      value={metalSettings.top.color}
                      onChange={(e) => updateMetalSetting("top", "color", e.target.value)}
                      className="flex-1 p-1 text-xs border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Roughness: {metalSettings.top.roughness.toFixed(2)} ({metalSettings.top.roughness > 0.5 ? "Matte" : "Glossy"})
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={metalSettings.top.roughness}
                      onChange={(e) => updateMetalSetting("top", "roughness", parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brightness: {metalSettings.top.brightness.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min={0.5}
                      max={2}
                      step={0.05}
                      value={metalSettings.top.brightness}
                      onChange={(e) => updateMetalSetting("top", "brightness", parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emissive Boost: {metalSettings.top.emissiveIntensity.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={2}
                      step={0.01}
                      value={metalSettings.top.emissiveIntensity}
                      onChange={(e) => updateMetalSetting("top", "emissiveIntensity", parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="text-sm flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={metalSettings.top.castShadow}
                        onChange={(e) => updateMetalSetting("top", "castShadow", e.target.checked)}
                      />
                      Cast Shadow
                    </label>
                    <label className="text-sm flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={metalSettings.top.receiveShadow}
                        onChange={(e) => updateMetalSetting("top", "receiveShadow", e.target.checked)}
                      />
                      Receive Shadow
                    </label>
                  </div>
                </div>
              </div>

              {/* Bottom */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Bottom Metal</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={metalSettings.bottom.color}
                      onChange={(e) => updateMetalSetting("bottom", "color", e.target.value)}
                      className="w-10 h-7 rounded border"
                    />
                    <input
                      type="text"
                      value={metalSettings.bottom.color}
                      onChange={(e) => updateMetalSetting("bottom", "color", e.target.value)}
                      className="flex-1 p-1 text-xs border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Roughness: {metalSettings.bottom.roughness.toFixed(2)} ({metalSettings.bottom.roughness > 0.5 ? "Matte" : "Glossy"})
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={metalSettings.bottom.roughness}
                      onChange={(e) => updateMetalSetting("bottom", "roughness", parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brightness: {metalSettings.bottom.brightness.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min={0.5}
                      max={2}
                      step={0.05}
                      value={metalSettings.bottom.brightness}
                      onChange={(e) => updateMetalSetting("bottom", "brightness", parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Emissive Boost: {metalSettings.bottom.emissiveIntensity.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={2}
                      step={0.01}
                      value={metalSettings.bottom.emissiveIntensity}
                      onChange={(e) => updateMetalSetting("bottom", "emissiveIntensity", parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="text-sm flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={metalSettings.bottom.castShadow}
                        onChange={(e) => updateMetalSetting("bottom", "castShadow", e.target.checked)}
                      />
                      Cast Shadow
                    </label>
                    <label className="text-sm flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={metalSettings.bottom.receiveShadow}
                        onChange={(e) => updateMetalSetting("bottom", "receiveShadow", e.target.checked)}
                      />
                      Receive Shadow
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Controls</h3>
              <div className="space-y-3">
                <button
                  onClick={toggleAutoRotation}
                  disabled={isRecording}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    isAutoRotating ? "bg-red-500 hover:bg-red-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"
                  } ${isRecording ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isAutoRotating ? "Stop Rotation" : "Start Rotation"}
                </button>

                <button
                  onClick={saveToPNG}
                  disabled={isRecording}
                  className={`w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors ${
                    isRecording ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Save as PNG
                </button>

                <button
                  onClick={startVideoRecording}
                  disabled={isRecording}
                  className={`w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors ${
                    isRecording ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isRecording ? `Recording... ${Math.round(recordingProgress)}%` : "Record 360° Video"}
                </button>
              </div>
            </div>

            {/* Lighting Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Lighting Settings</h3>
              <div className="space-y-4">
                {/* 전체 노출 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Overall Brightness (Exposure): {lightingSettings.exposure.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={4}          // ↑ 범위 확장
                    step={0.01}
                    value={lightingSettings.exposure}
                    onChange={(e) => setLightingSettings((p) => ({ ...p, exposure: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                {/* 바 조명 */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800">Bar Light</span>
                    <label className="text-sm flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={bar.enabled}
                        onChange={(e) => setBar((p) => ({ ...p, enabled: e.target.checked }))}
                      />
                      Enable
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 flex items-center gap-2">
                      <input
                        type="color"
                        value={bar.color}
                        onChange={(e) => setBar((p) => ({ ...p, color: e.target.value }))}
                        className="w-10 h-7 rounded border"
                      />
                      <input
                        type="text"
                        value={bar.color}
                        onChange={(e) => setBar((p) => ({ ...p, color: e.target.value }))}
                        className="flex-1 p-1 text-xs border rounded"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Intensity: {bar.intensity.toFixed(2)}</label>
                      <input
                        type="range"
                        min={0}
                        max={20}      // ↑ 범위 확장
                        step={0.05}
                        value={bar.intensity}
                        onChange={(e) => setBar((p) => ({ ...p, intensity: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bar Rotation: {Math.round((bar.rotation * 180) / Math.PI)}°
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={Math.PI * 2}
                        step={0.01}
                        value={bar.rotation}
                        onChange={(e) => setBar((p) => ({ ...p, rotation: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Height (Y): {bar.y.toFixed(2)}</label>
                      <input
                        type="range"
                        min={-3}
                        max={3}
                        step={0.01}
                        value={bar.y}
                        onChange={(e) => setBar((p) => ({ ...p, y: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Distance: {bar.distance.toFixed(1)}</label>
                      <input
                        type="range"
                        min={0.5}
                        max={15}     // ↑ 범위 확장
                        step={0.1}
                        value={bar.distance}
                        onChange={(e) => setBar((p) => ({ ...p, distance: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Width: {bar.width.toFixed(1)}</label>
                      <input
                        type="range"
                        min={0.1}
                        max={12}      // ↑ 범위 확장
                        step={0.1}
                        value={bar.width}
                        onChange={(e) => setBar((p) => ({ ...p, width: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Height: {bar.height.toFixed(1)}</label>
                      <input
                        type="range"
                        min={0.1}
                        max={16}      // ↑ 범위 확장
                        step={0.1}
                        value={bar.height}
                        onChange={(e) => setBar((p) => ({ ...p, height: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* 나머지 조명 */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-semibold text-gray-800 mb-2">Other Lights</div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Other Lights Strength: {lightingSettings.otherStrength.toFixed(2)}×
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={3}       // ↑ 범위 확장
                      step={0.01}
                      value={lightingSettings.otherStrength}
                      onChange={(e) => setLightingSettings((p) => ({ ...p, otherStrength: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Other Lights Rotation: {Math.round((lightingSettings.otherRotation * 180) / Math.PI)}°
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={Math.PI * 2}
                      step={0.01}
                      value={lightingSettings.otherRotation}
                      onChange={(e) => setLightingSettings((p) => ({ ...p, otherRotation: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                  </div>

                  <div className="border-t mt-3 pt-3 grid gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ambient: {lightingSettings.ambientIntensity.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={10}     // ↑ 범위 확장
                        step={0.1}
                        value={lightingSettings.ambientIntensity}
                        onChange={(e) => setLightingSettings((p) => ({ ...p, ambientIntensity: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fill: {lightingSettings.fillLightIntensity.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={10}     // ↑ 범위 확장
                        step={0.1}
                        value={lightingSettings.fillLightIntensity}
                        onChange={(e) => setLightingSettings((p) => ({ ...p, fillLightIntensity: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rim: {lightingSettings.rimLightIntensity.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={10}     // ↑ 범위 확장
                        step={0.1}
                        value={lightingSettings.rimLightIntensity}
                        onChange={(e) => setLightingSettings((p) => ({ ...p, rimLightIntensity: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Directional: {lightingSettings.directionalIntensity.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={10}     // ↑ 범위 확장
                        step={0.1}
                        value={lightingSettings.directionalIntensity}
                        onChange={(e) => setLightingSettings((p) => ({ ...p, directionalIntensity: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                    </div>

                    {/* (bar 미사용시) HDRI 강도 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Base Environment Intensity (when Bar disabled): {lightingSettings.envIntensity.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={4}      // ↑ 범위 확장
                        step={0.01}
                        value={lightingSettings.envIntensity}
                        onChange={(e) => setLightingSettings((p) => ({ ...p, envIntensity: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* 방향광 위치 입력은 유지 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Light Angle (Base Position)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      min={-20}
                      max={20}
                      value={lightingSettings.directionalPosition[0]}
                      onChange={(e) =>
                        updateLightingSetting("directionalPosition", [
                          parseFloat(e.target.value),
                          lightingSettings.directionalPosition[1],
                          lightingSettings.directionalPosition[2],
                        ])
                      }
                      className="w-full p-1 text-xs border rounded"
                      placeholder="X"
                    />
                    <input
                      type="number"
                      min={-20}
                      max={20}
                      value={lightingSettings.directionalPosition[1]}
                      onChange={(e) =>
                        updateLightingSetting("directionalPosition", [
                          lightingSettings.directionalPosition[0],
                          parseFloat(e.target.value),
                          lightingSettings.directionalPosition[2],
                        ])
                      }
                      className="w-full p-1 text-xs border rounded"
                      placeholder="Y"
                    />
                    <input
                      type="number"
                      min={-20}
                      max={20}
                      value={lightingSettings.directionalPosition[2]}
                      onChange={(e) =>
                        updateLightingSetting("directionalPosition", [
                          lightingSettings.directionalPosition[0],
                          lightingSettings.directionalPosition[1],
                          parseFloat(e.target.value),
                        ])
                      }
                      className="w-full p-1 text-xs border rounded"
                      placeholder="Z"
                    />
                  </div>
                </div>

                {/* Camera / Perspective */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">Camera / Perspective</h3>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Perspective (FOV): {Math.round(cameraFov)}°
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={60}
                    step={0.1}
                    value={cameraFov}
                    onChange={(e) => setCameraFov(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* 이미지 업로드 */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Custom Image</h3>
              <div className="space-y-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
                >
                  <div className="text-center">
                    <div className="text-gray-600">Click to upload image</div>
                    <div className="text-sm text-gray-400 mt-1">PNG, JPG up to 10MB</div>
                  </div>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                {customImage && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded">
                    <div className="text-sm text-green-700">✓ Custom image loaded</div>
                  </div>
                )}
              </div>
            </div>

            {/* 수동 회전 */}
            {!isAutoRotating && !isRecording && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Manual Rotation</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Y-axis (Horizontal): {Math.round((rotation[1] * 180) / Math.PI)}°
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={Math.PI * 2}
                      step={0.1}
                      value={rotation[1]}
                      onChange={(e) => setRotation([rotation[0], parseFloat(e.target.value), rotation[2]])}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      X-axis (Vertical): {Math.round((rotation[0] * 180) / Math.PI)}°
                    </label>
                    <input
                      type="range"
                      min={-Math.PI / 2}
                      max={Math.PI / 2}
                      step={0.1}
                      value={rotation[0]}
                      onChange={(e) => setRotation([parseFloat(e.target.value), rotation[1], rotation[2]])}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Z-axis (Roll): {Math.round((rotation[2] * 180) / Math.PI)}°
                    </label>
                    <input
                      type="range"
                      min={-Math.PI}
                      max={Math.PI}
                      step={0.1}
                      value={rotation[2]}
                      onChange={(e) => setRotation([rotation[0], rotation[1], parseFloat(e.target.value)])}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            <button onClick={resetToDefault} className="w-full p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
              Reset to Default
            </button>
          </div>
        </div>

        <div className="flex-1 relative bg-white">
          <Canvas
            camera={{ position: [0, 0, 4], fov: 25 }}
            shadows
            className="bg-transparent"
            style={{ background: "transparent" }}
            gl={{ preserveDrawingBuffer: true, alpha: true, localClippingEnabled: true }}
          >
            <SceneExposure exposure={lightingSettings.exposure} />
            <CameraPerspective fov={cameraFov} />
            <CustomLighting settings={lightingSettings} />
            <EditableSodaCan
              customTexture={customImage || flavorTextures[selectedFlavor]}
              rotation={rotation}
              isAutoRotating={isAutoRotating}
              isRecording={isRecording}
              recordingProgress={recordingProgress}
              canSize={canSize}
              labelRoughness={labelRoughness}
              metalSettings={metalSettings}
            />
            <CustomOrbitControls controlsRef={controlsRef} />
            <RotatingEnvironment
              barRotation={bar.rotation}
              otherRotation={lightingSettings.otherRotation}
              intensity={lightingSettings.envIntensity}
              bar={bar}
            />
          </Canvas>
        </div>
      </div>
    </div>
  );
}
