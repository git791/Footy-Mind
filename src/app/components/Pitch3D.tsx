import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import * as THREE from 'three';

// Create a 2D canvas texture for the pitch markings
function createPitchTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Grass background (Stripes - Horizontal lines since the pitch is vertical)
  const stripeHeight = canvas.height / 14;
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#4ade80' : '#22c55e'; // Tailwind green-400 and green-500
    ctx.fillRect(0, i * stripeHeight, canvas.width, stripeHeight);
  }

  // Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 4;

  const w = canvas.width;
  const h = canvas.height;
  const padding = 20;

  // Outline
  ctx.strokeRect(padding, padding, w - padding * 2, h - padding * 2);

  // Center Line
  ctx.beginPath();
  ctx.moveTo(padding, h / 2);
  ctx.lineTo(w - padding, h / 2);
  ctx.stroke();

  // Center Circle
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 70, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2);
  ctx.fill();

  // Top Penalty Box
  const boxW = 260;
  const boxH = 140;
  ctx.strokeRect((w - boxW) / 2, padding, boxW, boxH);
  // Top Goal Box
  ctx.strokeRect((w - 100) / 2, padding, 100, 45);
  // Top Penalty Spot
  ctx.beginPath(); ctx.arc(w / 2, padding + 90, 3, 0, Math.PI * 2); ctx.fill();
  // Top D (Arc)
  ctx.beginPath(); ctx.arc(w / 2, padding + 90, 70, 0, Math.PI); ctx.stroke();

  // Bottom Penalty Box
  ctx.strokeRect((w - boxW) / 2, h - padding - boxH, boxW, boxH);
  // Bottom Goal Box
  ctx.strokeRect((w - 100) / 2, h - padding - 45, 100, 45);
  // Bottom Penalty Spot
  ctx.beginPath(); ctx.arc(w / 2, h - padding - 90, 3, 0, Math.PI * 2); ctx.fill();
  // Bottom D (Arc)
  ctx.beginPath(); ctx.arc(w / 2, h - padding - 90, 70, Math.PI, Math.PI * 2); ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  return texture;
}

interface Player3DProps {
  position: [number, number, number];
  color: string;
  number: string;
  name?: string;
  selected?: boolean;
  onClick?: () => void;
}

function Player3D({ position, color, number, name, selected, onClick }: Player3DProps) {
  const meshRef = useRef<THREE.Group>(null);

  // Simple floating animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1;
    }
  });

  return (
    <group ref={meshRef} position={position} onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
      {/* Fat Torso */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.4, 4, 16]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      


      {/* Head Sphere */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#fcd34d" roughness={0.5} />
      </mesh>

      {/* Selection Ring */}
      {selected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.45, 0.55, 32]} />
          <meshBasicMaterial color="#ef4444" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Player Number Label */}
      <Html position={[0, 1.4, 0]} center zIndexRange={[40, 0]}>
        <div style={{
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '12px',
          fontFamily: "'Teko', sans-serif",
          fontSize: '14px',
          fontWeight: 'bold',
          pointerEvents: 'none',
          border: selected ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.2)',
          whiteSpace: 'nowrap'
        }}>
          {name ? `${number} ${name}` : number}
        </div>
      </Html>
    </group>
  );
}

export interface Pitch3DProps {
  players?: { id: string; position: [number, number]; team: 'home' | 'away'; number: string; name?: string }[];
  homeColor?: string;
  awayColor?: string;
  onPlayerClick?: (id: string) => void;
  selectedPlayerId?: string | null;
  showBall?: boolean;
  ballPosition?: [number, number];
  lines?: { start: [number, number]; end: [number, number]; color: string; dashed?: boolean }[];
}

export function Pitch3D({ 
  players = [], 
  homeColor = "#facc15", // yellow
  awayColor = "#3b82f6", // blue
  onPlayerClick,
  selectedPlayerId,
  showBall = false,
  ballPosition = [0, 0],
  lines = []
}: Pitch3DProps) {
  const texture = useMemo(() => createPitchTexture(), []);

  const mapPos = (x: number, y: number): [number, number, number] => {
    // The plane is 12 x 24 units, but the grass texture has a 20px padding (outline)
    // Canvas is 512x1024. Playable width = 512 - 40 = 472. Playable height = 1024 - 40 = 984.
    const playW = 12 * (472 / 512);
    const playH = 24 * (984 / 1024);

    const mappedX = (x / 100) * playW - (playW / 2);
    const mappedZ = (y / 144) * playH - (playH / 2);
    return [mappedX, 0, mappedZ];
  };

  return (
    <Canvas shadows camera={{ position: [0, 18, 18], fov: 40 }}>
      <color attach="background" args={["#0a1128"]} />
      
      <ambientLight intensity={0.6} />
      <directionalLight 
        position={[10, 20, 10]} 
        intensity={1.5} 
        castShadow 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048} 
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      
      <OrbitControls 
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 2 - 0.1}
        minDistance={5}
        maxDistance={40}
      />

      {/* The Pitch */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 24]} />
        <meshStandardMaterial map={texture} roughness={0.8} />
      </mesh>

      {/* Players */}
      {players.map(p => {
        const pos3D = mapPos(p.position[0], p.position[1]);
        return (
          <Player3D 
            key={p.id}
            position={pos3D}
            color={p.team === 'home' ? homeColor : awayColor}
            number={p.number}
            name={p.name}
            selected={selectedPlayerId === p.id}
            onClick={() => onPlayerClick?.(p.id)}
          />
        );
      })}

      {/* Ball */}
      {showBall && (
        <mesh position={mapPos(ballPosition[0], ballPosition[1]).map((v, i) => i === 1 ? 0.2 : v) as [number, number, number]} castShadow>
          <sphereGeometry args={[0.2, 32, 32]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
      )}

      {/* Custom Lines (e.g., passes, offside lines) */}
      {lines.map((line, idx) => {
        const start = mapPos(line.start[0], line.start[1]);
        const end = mapPos(line.end[0], line.end[1]);
        
        // Ensure lines hover slightly above grass to prevent z-fighting
        start[1] = 0.02;
        end[1] = 0.02;

        return (
          <mesh key={idx} position={[(start[0] + end[0])/2, 0.02, (start[2] + end[2])/2]}>
            <tubeGeometry args={[
              new THREE.LineCurve3(new THREE.Vector3(...start), new THREE.Vector3(...end)),
              20, 0.04, 8, false
            ]} />
            <meshBasicMaterial color={line.color} />
          </mesh>
        );
      })}

      <OrbitControls 
        makeDefault
        minPolarAngle={0} 
        maxPolarAngle={Math.PI / 2.1} 
        minDistance={5}
        maxDistance={25}
        enablePan={true}
      />
    </Canvas>
  );
}
