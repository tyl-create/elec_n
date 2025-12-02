import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Html, Text, PerspectiveCamera, GizmoHelper, GizmoViewcube } from '@react-three/drei';
import { Vector3, Plane, Raycaster, Vector2 } from 'three';
import { ChargeObject, TestPoint, InteractionMode, SimulationConfig } from '../types';
import { snapToGrid, calculateNetForce, calculateElectricField, calculatePotential } from '../utils/physics';
import { COLORS } from '../constants';
import { VectorArrow } from './VectorArrow';

// --- Sub-components for Scene Objects ---

export const ChargeObjectMesh: React.FC<{
  charge: ChargeObject;
  selected: boolean;
  config: SimulationConfig;
  allCharges: ChargeObject[];
  mode: InteractionMode;
  onSelect: (id: string) => void;
  onPointerDown: (e: any, id: string) => void;
}> = ({ charge, selected, config, allCharges, mode, onSelect, onPointerDown }) => {
  const [hovered, setHover] = useState(false);
  
  // Physics Force
  const { vector: forceVector, magnitude: forceMag } = calculateNetForce(charge, allCharges, config.k);

  // Colors
  const baseColor = charge.q > 0 ? COLORS.POSITIVE : COLORS.NEGATIVE;
  const isNeutral = charge.q === 0;
  const displayColor = isNeutral ? '#9ca3af' : baseColor;

  // Geometry Rendering
  const renderGeometry = () => {
    switch (charge.type) {
        case 'RING':
            return (
                <torusGeometry args={[charge.radius, 0.1, 32, 64]} />
            );
        case 'SPHERE_CONDUCTING':
            return (
                 <sphereGeometry args={[charge.radius, 32, 32]} />
            );
        case 'SPHERE_NON_CONDUCTING':
            return (
                 <sphereGeometry args={[charge.radius, 32, 32]} />
            );
        case 'POINT':
        default:
             // Dynamic visual size for point charges
             const r = 0.15 + Math.log(1 + Math.abs(charge.q)) * 0.05;
             return <sphereGeometry args={[r, 32, 32]} />;
    }
  };

  const renderMaterial = () => {
      if (charge.type === 'SPHERE_CONDUCTING') {
          return (
            <meshStandardMaterial 
                color={COLORS.CONDUCTOR} 
                metalness={1.0} 
                roughness={0.1}
                emissive={displayColor}
                emissiveIntensity={0.2}
            />
          );
      } else if (charge.type === 'SPHERE_NON_CONDUCTING') {
          return (
            <meshPhysicalMaterial 
                color={displayColor}
                transmission={0.4}
                opacity={0.6}
                transparent
                roughness={0.2}
                thickness={charge.radius}
                emissive={displayColor}
                emissiveIntensity={0.3}
            />
          );
      } else if (charge.type === 'RING') {
          return (
             <meshStandardMaterial 
                color={displayColor}
                emissive={displayColor}
                emissiveIntensity={0.5}
             />
          );
      } else {
          // Point
          return (
            <meshStandardMaterial
                color={displayColor}
                emissive={displayColor}
                emissiveIntensity={0.6}
            />
          );
      }
  }

  // Rotation for Ring to lie flat on XZ plane
  const rotation: [number, number, number] = charge.type === 'RING' ? [Math.PI / 2, 0, 0] : [0, 0, 0];
  const isAddMode = mode.startsWith('ADD_');
  
  return (
    <group position={charge.position}>
      <mesh
        rotation={rotation}
        onClick={(e) => {
          if (isAddMode) return; 
          e.stopPropagation();
          onSelect(charge.id);
        }}
        onPointerDown={(e) => {
           if (isAddMode) return; 
           e.stopPropagation();
           onPointerDown(e, charge.id);
        }}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        {renderGeometry()}
        {renderMaterial()}
      </mesh>
      
      {/* Selection Highlight */}
      {selected && (
        <mesh rotation={rotation}>
             {charge.type === 'RING' ? (
                <torusGeometry args={[charge.radius, 0.05, 32, 64]} />
             ) : (
                <sphereGeometry args={[charge.type === 'POINT' ? 0.35 : charge.radius * 1.05, 32, 32]} />
             )}
            <meshBasicMaterial color={COLORS.SELECTION} wireframe opacity={0.5} transparent />
        </mesh>
      )}

      {/* Force Vector (F) */}
      {config.showVectors && (
        <VectorArrow
          origin={new Vector3(0, 0, 0)}
          directionVector={forceVector}
          color={COLORS.VECTOR_FORCE}
          scaleFactor={config.vectorScale}
          label={`F`}
        />
      )}
      
      {/* Label */}
      <Html position={[0, charge.type === 'POINT' ? 0.4 : charge.radius + 0.4, 0]} center style={{ pointerEvents: 'none', zIndex: 0 }}>
        <div className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded backdrop-blur-md whitespace-nowrap border shadow-sm ${
            charge.q > 0 
            ? 'text-white bg-red-600/80 border-red-400' 
            : 'text-white bg-blue-600/80 border-blue-400'
        }`}>
          {charge.q > 0 ? '+' : ''}{charge.q} {config.chargeUnit}
        </div>
      </Html>
    </group>
  );
};

export const TestPointMesh: React.FC<{
  point: TestPoint;
  allCharges: ChargeObject[];
  config: SimulationConfig;
  onSelect: (id: string) => void;
  onPointerDown: (e: any, id: string) => void;
  selected: boolean;
}> = ({ point, allCharges, config, onSelect, onPointerDown, selected }) => {
  const { vector: eVector, magnitude: eMag } = calculateElectricField(point.position, allCharges, config.k);
  
  return (
    <group position={point.position}>
      <mesh 
        onClick={(e) => {
          e.stopPropagation();
          onSelect(point.id);
        }}
        onPointerDown={(e) => {
           e.stopPropagation();
           onPointerDown(e, point.id);
        }}
      >
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={COLORS.TEST_POINT}
          emissive={COLORS.TEST_POINT}
          emissiveIntensity={0.8}
        />
      </mesh>
      
      {selected && (
         <mesh>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshBasicMaterial color={COLORS.SELECTION} wireframe />
         </mesh>
      )}

      {/* E-Field Vector (E) */}
      {config.showVectors && (
        <VectorArrow
          origin={new Vector3(0, 0, 0)}
          directionVector={eVector}
          color={COLORS.VECTOR_FIELD}
          scaleFactor={config.vectorScale * 2}
          label={`E`}
        />
      )}
    </group>
  );
};

// --- Main Scene Interaction Handler ---

export const SceneInteraction: React.FC<{
  mode: InteractionMode;
  config: SimulationConfig;
  onPlaceObject: (position: Vector3) => void;
}> = ({ mode, config, onPlaceObject }) => {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      onClick={(e) => {
        if (mode === InteractionMode.VIEW || mode === InteractionMode.SELECT) return;
        e.stopPropagation();
        const point = e.point;
        const snapped = snapToGrid(point, config.gridStep);
        onPlaceObject(snapped);
      }}
      visible={false}
    >
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
};

// --- Custom Drag Controls ---
export const DragController: React.FC<{
  draggingId: string | null;
  onDragMove: (pos: Vector3) => void;
  onDragEnd: () => void;
}> = ({ draggingId, onDragMove, onDragEnd }) => {
  const { camera, gl, scene } = useThree();
  const raycaster = useRef(new Raycaster());
  const plane = useRef(new Plane(new Vector3(0, 1, 0), 0)); // XZ Plane

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!draggingId) return;

      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.current.setFromCamera(new Vector2(x, y), camera);
      const target = new Vector3();
      const intersection = raycaster.current.ray.intersectPlane(plane.current, target);
      
      if (intersection) {
        onDragMove(intersection);
      }
    };

    const handlePointerUp = () => {
      if (draggingId) {
        onDragEnd();
      }
    };

    if (draggingId) {
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingId, onDragMove, onDragEnd, camera, gl]);

  return null;
};


// --- World Component ---

interface WorldProps {
  charges: ChargeObject[];
  testPoints: TestPoint[];
  config: SimulationConfig;
  mode: InteractionMode;
  selectedId: string | null;
  onChargeSelect: (id: string) => void;
  onChargeMove: (id: string, pos: Vector3) => void;
  onPlaceObject: (pos: Vector3) => void;
}

export const World: React.FC<WorldProps> = (props) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const controlsRef = useRef<any>(null);

  const handlePointerDownObject = (e: any, id: string) => {
    if (props.mode !== InteractionMode.VIEW && props.mode !== InteractionMode.SELECT) return;
    setDraggingId(id);
    if (controlsRef.current) controlsRef.current.enabled = false;
    props.onChargeSelect(id);
  };

  const handleDragMove = (pos: Vector3) => {
    if (draggingId) {
      pos.y = 0; 
      props.onChargeMove(draggingId, pos);
    }
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    if (controlsRef.current) controlsRef.current.enabled = true;
  };

  const cellThickness = props.config.gridStep < 0.5 ? 0.4 : 0.6;
  const sectionThickness = props.config.gridStep < 0.5 ? 1.0 : 1.2;
  const sectionSize = props.config.gridStep < 0.5 ? props.config.gridStep * 10 : props.config.gridStep * 5;

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
    >
      <PerspectiveCamera makeDefault position={[5, 8, 10]} fov={50} />
      <color attach="background" args={['#0f172a']} />
      
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 15, 10]} intensity={1.5} castShadow />
      <pointLight position={[-10, 5, -10]} intensity={0.8} />
      <directionalLight position={[0, 10, 0]} intensity={0.8} />

      {/* Interactive Controls */}
      <OrbitControls 
        ref={controlsRef}
        makeDefault 
        minDistance={2}
        maxDistance={50}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
      />

      <DragController 
        draggingId={draggingId} 
        onDragMove={handleDragMove} 
        onDragEnd={handleDragEnd} 
      />

      {/* Grid */}
      {props.config.showGrid && (
        <group>
            <Grid
            infiniteGrid
            fadeDistance={60}
            fadeStrength={1.5}
            sectionSize={sectionSize}
            cellSize={props.config.gridStep}
            sectionColor={COLORS.GRID_SECTION}
            cellColor={COLORS.GRID}
            cellThickness={cellThickness}
            sectionThickness={sectionThickness}
            position={[0, -0.01, 0]}
            />
            <Text position={[props.config.gridStep, 0.05, 0]} rotation={[-Math.PI/2, 0, 0]} fontSize={props.config.gridStep * 0.3} color="#94a3b8">
                {props.config.gridStep} {props.config.distanceUnit}
            </Text>
        </group>
      )}
      
      <group>
          <axesHelper args={[3]} />
          <Text position={[3.2, 0, 0]} fontSize={0.3} color="#ef4444" fontWeight={800}>X</Text>
          <Text position={[0, 3.2, 0]} fontSize={0.3} color="#22c55e" fontWeight={800}>Y</Text>
          <Text position={[0, 0, 3.2]} fontSize={0.3} color="#3b82f6" fontWeight={800}>Z</Text>
      </group>

      <GizmoHelper alignment="top-right" margin={[70, 70]}>
        <GizmoViewcube 
            opacity={0.9} 
            color="white" 
            strokeColor="gray" 
            textColor="black"
            hoverColor="#cbd5e1"
        />
      </GizmoHelper>

      <SceneInteraction 
        mode={props.mode} 
        config={props.config}
        onPlaceObject={props.onPlaceObject} 
      />

      {props.charges.map((charge) => (
        <ChargeObjectMesh
          key={charge.id}
          charge={charge}
          selected={props.selectedId === charge.id}
          allCharges={props.charges}
          config={props.config}
          mode={props.mode}
          onSelect={props.onChargeSelect}
          onPointerDown={handlePointerDownObject}
        />
      ))}

      {props.testPoints.map((tp) => (
        <TestPointMesh
          key={tp.id}
          point={tp}
          allCharges={props.charges}
          config={props.config}
          onSelect={props.onChargeSelect}
          onPointerDown={handlePointerDownObject}
          selected={props.selectedId === tp.id}
        />
      ))}
    </Canvas>
  );
};
