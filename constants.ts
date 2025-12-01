
export const COLORS = {
  POSITIVE: '#ff204e', // Neon Red
  NEGATIVE: '#008dda', // Neon Blue
  TEST_POINT: '#f9e400', // Neon Yellow
  GRID: '#475569', // Slate 600 (Visible but not distracting)
  GRID_SECTION: '#94a3b8', // Slate 400
  VECTOR_FORCE: '#00ff00', // Bright Green
  VECTOR_FIELD: '#ff00ff', // Magenta
  SELECTION: '#ffffff',
  CONDUCTOR: '#00ffff', // Cyan (Bright metallic)
  DIELECTRIC: '#bd93f9', // Light Purple
};

export const DEFAULT_CONFIG = {
  k: 10, // Arbitrary simulation constant to make numbers look nice
  gridStep: 1.0,
  showGrid: true,
  showVectors: true,
  vectorScale: 1.0,
  chargeUnit: 'μC',
  distanceUnit: 'm',
};

export const MAX_VECTOR_LENGTH_VISUAL = 4; // Max length in 3D units for arrows

export const DEFAULTS = {
  POINT_RADIUS: 0.15,
  RING_RADIUS: 1.0,
  SPHERE_RADIUS: 0.8,
};
