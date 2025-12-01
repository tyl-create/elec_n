import { Vector3 } from 'three';

export enum AppMode {
  STATIC = 'STATIC',
  DYNAMIC = 'DYNAMIC'
}

export type ChargeType = 'POINT' | 'RING' | 'SPHERE_CONDUCTING' | 'SPHERE_NON_CONDUCTING';

export interface ChargeObject {
  id: string;
  type: ChargeType;
  position: Vector3;
  q: number; // Charge magnitude (can be negative)
  radius: number; // For point charges, this might be visual only, for others it's physical
  draggable?: boolean;
  
  // Dynamic properties
  mass?: number; // kg
  velocity?: Vector3;
  isFixed?: boolean; // If true, unaffected by forces (like pinned charges)
}

export interface TestPoint {
  id: string;
  position: Vector3;
}

export interface SimulationConfig {
  k: number; // Coulomb constant
  gridStep: number;
  showGrid: boolean;
  showVectors: boolean;
  vectorScale: number; // Visual scaling factor
  chargeUnit: string;
  distanceUnit: string;
}

export enum InteractionMode {
  VIEW = 'VIEW',
  ADD_POINT_POS = 'ADD_POINT_POS',
  ADD_POINT_NEG = 'ADD_POINT_NEG',
  ADD_RING = 'ADD_RING',
  ADD_SPHERE_COND = 'ADD_SPHERE_COND',
  ADD_SPHERE_NONCOND = 'ADD_SPHERE_NONCOND',
  ADD_TEST_POINT = 'ADD_TEST_POINT',
  SELECT = 'SELECT',
}

export interface VectorResult {
  vector: Vector3; // The direction and magnitude
  magnitude: number;
}