/**
 * @file: TrailerScene3D.tsx
 * @description: WebGL-сцена (Three.js): прицеп с полупрозрачными стенами, разноцветные кейсы. Камера по viewRotation/zoom.
 * @dependencies: three, @react-three/fiber, @react-three/drei
 * @created: 2026-01-27
 */

import { useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const TRAILER = { length: 1360, width: 245, height: 270 };
const CRATE_COLORS = ['#f9a825', '#e91e63', '#c62828', '#7b1fa2', '#1565c0', '#0097a7', '#00695c'];
const BASE_DISTANCE = 2200;

interface TrailerScene3DProps {
  viewRotation: { x: number; y: number };
  zoom: number;
  placedCrates: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    z: number;
    length: number;
    width: number;
    height: number;
  }>;
}

function TrailerWithWheels() {
  const L = TRAILER.length;
  const W = TRAILER.width;
  const H = TRAILER.height;

  const wallProps = {
    color: '#e8e8ec',
    transparent: true,
    opacity: 0.35,
    roughness: 0.5,
    metalness: 0.05,
    side: THREE.DoubleSide,
  };

  return (
    <group position={[0, 0, 0]}>
      {/* Пол */}
      <mesh position={[0, -2, 0]} receiveShadow>
        <boxGeometry args={[L, 4, W]} />
        <meshStandardMaterial color="#d0d4dc" roughness={0.6} metalness={0.05} />
      </mesh>
      {/* Крыша */}
      <mesh position={[0, H + 2, 0]} receiveShadow>
        <boxGeometry args={[L, 4, W]} />
        <meshStandardMaterial {...wallProps} />
      </mesh>
      {/* Стены — полупрозрачные */}
      <mesh position={[0, H / 2, -W / 2 - 2]}>
        <boxGeometry args={[L + 8, H + 8, 4]} />
        <meshStandardMaterial {...wallProps} />
      </mesh>
      <mesh position={[0, H / 2, W / 2 + 2]}>
        <boxGeometry args={[L + 8, H + 8, 4]} />
        <meshStandardMaterial {...wallProps} />
      </mesh>
      <mesh position={[-L / 2 - 2, H / 2, 0]}>
        <boxGeometry args={[4, H + 8, W + 8]} />
        <meshStandardMaterial {...wallProps} />
      </mesh>
      <mesh position={[L / 2 + 2, H / 2, 0]}>
        <boxGeometry args={[4, H + 8, W + 8]} />
        <meshStandardMaterial {...wallProps} />
      </mesh>
    </group>
  );
}

function Crates({ placedCrates }: { placedCrates: TrailerScene3DProps['placedCrates'] }) {
  const L = TRAILER.length;
  const W = TRAILER.width;

  return (
    <group position={[0, 0, 0]}>
      {placedCrates.map((c, i) => {
        const posX = c.x + c.length / 2 - L / 2;
        const posY = c.z + c.height / 2;
        const posZ = c.y + c.width / 2 - W / 2;
        const color = CRATE_COLORS[i % CRATE_COLORS.length];
        return (
          <mesh key={`${c.id}-${i}`} position={[posX, posY, posZ]} castShadow receiveShadow>
            <boxGeometry args={[c.length, c.height, c.width]} />
            <meshStandardMaterial color={color} roughness={0.45} metalness={0.08} />
          </mesh>
        );
      })}
    </group>
  );
}

function CameraController({
  viewRotation,
  zoom,
}: {
  viewRotation: { x: number; y: number };
  zoom: number;
}) {
  const { camera } = useThree();
  const polar = ((90 + viewRotation.x) * Math.PI) / 180;
  const azimuth = (viewRotation.y * Math.PI) / 180;
  const r = BASE_DISTANCE / Math.max(0.4, Math.min(3, zoom));

  useFrame(() => {
    camera.position.set(
      r * Math.sin(polar) * Math.sin(azimuth),
      r * Math.cos(polar),
      r * Math.sin(polar) * Math.cos(azimuth)
    );
    camera.lookAt(0, TRAILER.height / 2, 0);
  });

  return null;
}

function SceneContent({ viewRotation, zoom, placedCrates }: TrailerScene3DProps) {
  const { scene } = useThree();
  useEffect(() => {
    scene.background = new THREE.Color(0xffffff);
    return () => { scene.background = null; };
  }, [scene]);

  return (
    <>
      <CameraController viewRotation={viewRotation} zoom={zoom} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[500, 700, 400]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-400, 500, -300]} intensity={0.35} />
      <TrailerWithWheels />
      <Crates placedCrates={placedCrates} />
    </>
  );
}

export function TrailerScene3D(props: TrailerScene3DProps) {
  return (
    <Canvas
      shadows
      camera={{ fov: 50, near: 10, far: 8000 }}
      gl={{ antialias: true, alpha: false }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <SceneContent {...props} />
    </Canvas>
  );
}
