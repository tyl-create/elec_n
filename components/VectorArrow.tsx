import React, { useMemo } from 'react';
import { Vector3, Quaternion } from 'three';
import { Cylinder, Cone, Text, Billboard } from '@react-three/drei';
import { MAX_VECTOR_LENGTH_VISUAL } from '../constants';

interface VectorArrowProps {
  origin: Vector3;
  directionVector: Vector3; // The actual physics vector (direction * magnitude)
  color: string;
  label?: string;
  visible?: boolean;
  scaleFactor?: number; // User adjustable scaling preference
}

export const VectorArrow: React.FC<VectorArrowProps> = ({
  origin,
  directionVector,
  color,
  label,
  visible = true,
  scaleFactor = 1.0,
}) => {
  if (!visible || directionVector.lengthSq() < 0.0001) return null;

  const { length, quaternion } = useMemo(() => {
    const mag = directionVector.length();
    
    // Logarithmic-ish scaling to handle large dynamic range while keeping direction visible
    let visualLength = Math.log(1 + mag) * scaleFactor;
    
    // Clamp to max visual length
    visualLength = Math.min(visualLength, MAX_VECTOR_LENGTH_VISUAL * 2);

    const dir = directionVector.clone().normalize();
    const up = new Vector3(0, 1, 0);
    const quaternion = new Quaternion().setFromUnitVectors(up, dir);

    return { length: visualLength, quaternion };
  }, [directionVector, scaleFactor]);

  if (length < 0.2) return null; // Too small to render meaningful arrow

  const cylinderLen = length * 0.8;
  const coneLen = length * 0.2;
  const cylinderRadius = 0.05;
  const coneRadius = 0.15;

  return (
    <group position={origin} quaternion={quaternion}>
      {/* Shaft */}
      <Cylinder
        args={[cylinderRadius, cylinderRadius, cylinderLen, 8]}
        position={[0, cylinderLen / 2, 0]}
      >
        <meshStandardMaterial color={color} />
      </Cylinder>
      {/* Arrow Head */}
      <Cone
        args={[coneRadius, coneLen, 16]}
        position={[0, cylinderLen + coneLen / 2, 0]}
      >
        <meshStandardMaterial color={color} />
      </Cone>
      
      {/* Label */}
      {label && (
        <Billboard position={[0, length + 0.3, 0]}>
          <Text
            fontSize={0.25}
            color={color}
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {label}
          </Text>
        </Billboard>
      )}
    </group>
  );
};