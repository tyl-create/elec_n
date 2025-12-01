import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Text, PerspectiveCamera, GizmoHelper, GizmoViewcube } from '@react-three/drei';
import { ChargeObject, TestPoint, InteractionMode, SimulationConfig } from '../types';
import { updateChargeDynamics, snapToGrid } from '../utils/physics';
import { COLORS } from '../constants';
import { ChargeObjectMesh, TestPointMesh, SceneInteraction, DragController } from './World';
import { Vector3, Plane, Raycaster, Vector2 } from 'three';

interface DynamicWorldProps {
  charges: ChargeObject[];
  testPoints: TestPoint[];
  config: SimulationConfig;
  mode: InteractionMode;
  selectedId: string | null;
  isPlaying: boolean;
  onChargeSelect: (id: string) => void;
  onChargeMove: (id: string, pos: Vector3) => void;
  onPlaceObject: (pos: Vector3) => void;
  updateChargesFromSim: (charges: ChargeObject[]) => void;
}

// Internal component to run the loop
const PhysicsLoop: React.FC<{
  isPlaying: boolean;
  charges: ChargeObject[];
  config: SimulationConfig;
  onUpdate: (newCharges: ChargeObject[]) => void;
}> = ({ isPlaying, charges, config, onUpdate }) => {
  const chargesRef = useRef(charges);
  // Keep ref in sync when props change (e.g. user added a charge)
  useEffect(() => {
    chargesRef.current = charges;
  }, [charges]);

  useFrame((state, delta) => {
    if (!isPlaying) return;
    // Cap delta to avoid explosion on lag
    const dt = Math.min(delta, 0.1);
    
    const newCharges = updateChargeDynamics(chargesRef.current, dt, config.k);
    chargesRef.current = newCharges;
    onUpdate(newCharges);
  });

  return null;
};

export const DynamicWorld: React.FC<DynamicWorldProps> = (props) => {
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
    <Canvas shadows dpr={[1, 2]}>
      <PerspectiveCamera makeDefault position={[5, 8, 10]} fov={50} />
      <color attach="background" args={['#0f172a']} />
      
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 15, 10]} intensity={1.5} castShadow />
      <pointLight position={[-10, 5, -10]} intensity={0.8} />
      <directionalLight position={[0, 10, 0]} intensity={0.8} />

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

      <PhysicsLoop 
        isPlaying={props.isPlaying} 
        charges={props.charges} 
        config={props.config} 
        onUpdate={props.updateChargesFromSim} 
      />

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
