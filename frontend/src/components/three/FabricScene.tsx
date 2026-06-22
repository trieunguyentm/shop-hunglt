'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Hiệu ứng "Silk Orbit" — đám hạt phân bố trên mặt cầu (Fibonacci sphere),
 * xoay chậm + "thở" nhẹ + parallax theo con trỏ. Tối giản, sang trọng, đúng tinh thần
 * editorial fashion. Đóng khung an toàn (camera lùi xa) nên không bao giờ bị cắt.
 * Xem skill motion-3d để biết quy tắc hiệu năng.
 */

// Phân bố điểm đều trên mặt cầu bằng dãy Fibonacci
function fibonacciSphere(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2; // -1 → 1
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    positions[i * 3] = Math.cos(theta) * r * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = Math.sin(theta) * r * radius;
  }
  return positions;
}

function PointSphere({
  count,
  radius,
  color,
  size,
  speed,
  opacity = 1,
}: {
  count: number;
  radius: number;
  color: string;
  size: number;
  speed: number;
  opacity?: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => fibonacciSphere(count, radius), [count, radius]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * speed;
    ref.current.rotation.x += delta * speed * 0.35;
    // "Thở" nhẹ theo thời gian
    const s = 1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.04;
    ref.current.scale.setScalar(s);
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={positions.length / 3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        sizeAttenuation
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </points>
  );
}

function Orbit() {
  const group = useRef<THREE.Group>(null);
  // Mục tiêu xoay theo con trỏ (parallax mượt)
  const target = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    if (!group.current) return;
    // state.pointer: -1..1
    target.current.x = state.pointer.y * 0.25;
    target.current.y = state.pointer.x * 0.4;
    group.current.rotation.x += (target.current.x - group.current.rotation.x) * 0.04;
    group.current.rotation.y += (target.current.y - group.current.rotation.y) * 0.04;
  });

  return (
    <group ref={group}>
      {/* Vỏ ngoài — màu đất nung thương hiệu */}
      <PointSphere count={2800} radius={2.6} color="#B25C3C" size={0.04} speed={0.05} />
      {/* Lớp giữa — sắc nhạt hơn tạo chiều sâu */}
      <PointSphere
        count={1400}
        radius={1.9}
        color="#D98E6E"
        size={0.035}
        speed={-0.07}
        opacity={0.85}
      />
      {/* Lõi mực — điểm nhấn tương phản */}
      <PointSphere
        count={700}
        radius={1.1}
        color="#1A1714"
        size={0.03}
        speed={0.1}
        opacity={0.7}
      />
    </group>
  );
}

export default function FabricScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <Orbit />
    </Canvas>
  );
}
