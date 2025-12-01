
import { Vector3 } from 'three';
import { ChargeObject, VectorResult } from '../types';

/**
 * Calculates the Electric Field (E) at a specific position caused by a single charge object.
 */
export const getFieldFromObject = (position: Vector3, charge: ChargeObject, k: number): Vector3 => {
  const rVec = new Vector3().subVectors(position, charge.position);
  const dist = rVec.length();
  const eField = new Vector3(0, 0, 0);

  // Avoid singularities
  if (dist < 0.05) return eField;

  switch (charge.type) {
    case 'POINT': {
      const magnitude = (k * charge.q) / (dist * dist);
      eField.copy(rVec).normalize().multiplyScalar(magnitude);
      break;
    }
    case 'SPHERE_CONDUCTING': {
      // Shell Theorem:
      // Outside (r >= R): Acts like point charge at center
      // Inside (r < R): E = 0
      if (dist >= charge.radius) {
        const magnitude = (k * charge.q) / (dist * dist);
        eField.copy(rVec).normalize().multiplyScalar(magnitude);
      } else {
        // Inside conductor E = 0
        eField.set(0, 0, 0);
      }
      break;
    }
    case 'SPHERE_NON_CONDUCTING': {
      // Uniformly charged sphere
      // Outside (r >= R): Acts like point charge
      // Inside (r < R): E = k * Q * r / R^3 (Linear increase)
      if (dist >= charge.radius) {
        const magnitude = (k * charge.q) / (dist * dist);
        eField.copy(rVec).normalize().multiplyScalar(magnitude);
      } else {
        const magnitude = (k * charge.q * dist) / (charge.radius * charge.radius * charge.radius);
        eField.copy(rVec).normalize().multiplyScalar(magnitude);
      }
      break;
    }
    case 'RING': {
      // Discretization approach for Ring (in XZ plane)
      // Robust for any 3D point
      const SAMPLES = 40;
      const dQ = charge.q / SAMPLES;
      
      for (let i = 0; i < SAMPLES; i++) {
        const theta = (i / SAMPLES) * Math.PI * 2;
        // Ring assumed flat on XZ plane relative to its center
        const dx = Math.cos(theta) * charge.radius;
        const dz = Math.sin(theta) * charge.radius;
        const samplePos = new Vector3(charge.position.x + dx, charge.position.y, charge.position.z + dz);
        
        const rSample = new Vector3().subVectors(position, samplePos);
        const dR = rSample.length();
        if (dR > 0.1) {
          const dE = (k * dQ) / (dR * dR);
          eField.add(rSample.normalize().multiplyScalar(dE));
        }
      }
      break;
    }
  }

  return eField;
};

/**
 * Calculates the Total Electric Field (E) at a position.
 */
export const calculateElectricField = (
  position: Vector3,
  charges: ChargeObject[],
  k: number
): VectorResult => {
  const totalE = new Vector3(0, 0, 0);
  
  charges.forEach((charge) => {
    totalE.add(getFieldFromObject(position, charge, k));
  });

  return {
    vector: totalE.clone(),
    magnitude: totalE.length(),
  };
};

/**
 * Calculates the Electric Potential (V) at a specific position.
 */
export const calculatePotential = (
  position: Vector3,
  charges: ChargeObject[],
  k: number
): number => {
  let potential = 0;
  
  charges.forEach((charge) => {
    const dist = position.distanceTo(charge.position);
    
    // Avoid division by zero
    if (dist < 0.05) return;

    switch (charge.type) {
      case 'POINT':
        potential += (k * charge.q) / dist;
        break;
      
      case 'SPHERE_CONDUCTING':
        if (dist >= charge.radius) {
          potential += (k * charge.q) / dist;
        } else {
          // Constant potential inside V = kQ/R
          potential += (k * charge.q) / charge.radius;
        }
        break;

      case 'SPHERE_NON_CONDUCTING':
        if (dist >= charge.radius) {
          potential += (k * charge.q) / dist;
        } else {
          // V = (kQ / 2R) * (3 - r^2/R^2)
          const term = 3 - (dist * dist) / (charge.radius * charge.radius);
          potential += ((k * charge.q) / (2 * charge.radius)) * term;
        }
        break;

      case 'RING':
        // Discretize potential
        const SAMPLES = 30;
        const dQ = charge.q / SAMPLES;
        for (let i = 0; i < SAMPLES; i++) {
          const theta = (i / SAMPLES) * Math.PI * 2;
          const dx = Math.cos(theta) * charge.radius;
          const dz = Math.sin(theta) * charge.radius;
          const samplePos = new Vector3(charge.position.x + dx, charge.position.y, charge.position.z + dz);
          const d = position.distanceTo(samplePos);
          if (d > 0.05) potential += (k * dQ) / d;
        }
        break;
    }
  });

  return potential;
};

/**
 * Calculates the Net Force (F) acting on a specific charge due to others.
 * F = q * E_ext (integrated over the body)
 */
export const calculateNetForce = (
  target: ChargeObject,
  allCharges: ChargeObject[],
  k: number
): VectorResult => {
  const otherCharges = allCharges.filter(c => c.id !== target.id);
  const totalForce = new Vector3(0, 0, 0);

  // If there are no other charges, force is zero
  if (otherCharges.length === 0) {
    return { vector: totalForce, magnitude: 0 };
  }

  // Calculate Field produced by OTHERS at specific points on the target
  // Then sum F = q_i * E_i
  
  if (target.type === 'POINT' || target.type.includes('SPHERE')) {
    // Approx: For spheres, we usually treat them as point charges at center for the force they *feel* 
    // in an external field (Center of Mass approx). 
    // This is exact for spheres in uniform fields, and decent for non-uniform if far away.
    const eField = calculateElectricField(target.position, otherCharges, k);
    totalForce.copy(eField.vector).multiplyScalar(target.q);
  } else if (target.type === 'RING') {
    // Discretize the ring to find net force
    const SAMPLES = 20;
    const dQ = target.q / SAMPLES;
    
    for (let i = 0; i < SAMPLES; i++) {
        const theta = (i / SAMPLES) * Math.PI * 2;
        const dx = Math.cos(theta) * target.radius;
        const dz = Math.sin(theta) * target.radius;
        const samplePos = new Vector3(target.position.x + dx, target.position.y, target.position.z + dz);
        
        const eAtSample = calculateElectricField(samplePos, otherCharges, k);
        totalForce.add(eAtSample.vector.multiplyScalar(dQ));
    }
  }

  return {
    vector: totalForce,
    magnitude: totalForce.length(),
  };
};

export const snapToGrid = (position: Vector3, step: number): Vector3 => {
  return new Vector3(
    Math.round(position.x / step) * step,
    Math.round(position.y / step) * step,
    Math.round(position.z / step) * step
  );
};

export const updateChargeDynamics = (
  charges: ChargeObject[],
  dt: number,
  k: number,
  damping: number = 0.98
): ChargeObject[] => {
  // 1. Calculate forces for all dynamic charges first (simultaneous update)
  const updates = charges.map(charge => {
    if (charge.isFixed) {
      return { force: new Vector3(0,0,0) };
    }
    const { vector: force } = calculateNetForce(charge, charges, k);
    return { force };
  });

  // 2. Apply integration (Semi-implicit Euler or Velocity Verlet simplified)
  return charges.map((c, i) => {
    if (c.isFixed) return c;

    const force = updates[i].force;
    const mass = c.mass || 1.0;
    
    // a = F/m
    // v_new = v_old + a * dt
    // p_new = p_old + v_new * dt
    
    const acceleration = force.clone().divideScalar(mass);
    const oldVelocity = c.velocity ? c.velocity.clone() : new Vector3(0,0,0);
    
    // Update velocity
    const newVelocity = oldVelocity.add(acceleration.multiplyScalar(dt));
    
    // Apply damping (air resistance)
    newVelocity.multiplyScalar(damping);

    // Update position
    const newPosition = c.position.clone().add(newVelocity.clone().multiplyScalar(dt));

    return {
      ...c,
      velocity: newVelocity,
      position: newPosition
    };
  });
};
