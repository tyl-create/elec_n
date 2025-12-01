
import React, { useState, useCallback } from 'react';
import { Vector3 } from 'three';
import { World } from './components/World';
import { DynamicWorld } from './components/DynamicWorld';
import { Controls } from './components/Controls';
import { ObservationPanel } from './components/ObservationPanel';
import { InteractionMode, ChargeObject, SimulationConfig, TestPoint, AppMode } from './types';
import { DEFAULT_CONFIG, DEFAULTS } from './constants';

const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  const [appMode, setAppMode] = useState<AppMode>(AppMode.STATIC);
  
  // Static state
  const [charges, setCharges] = useState<ChargeObject[]>([
    { id: 'c1', type: 'POINT', position: new Vector3(-2, 0, 0), q: 5, radius: DEFAULTS.POINT_RADIUS, mass: 1 },
    { id: 'c2', type: 'POINT', position: new Vector3(2, 0, 0), q: -5, radius: DEFAULTS.POINT_RADIUS, mass: 1 }
  ]);
  const [testPoints, setTestPoints] = useState<TestPoint[]>([]);
  
  // Dynamic state
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [mode, setMode] = useState<InteractionMode>(InteractionMode.VIEW);
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handlePlaceObject = useCallback((position: Vector3) => {
    let newCharge: ChargeObject | null = null;
    let newTestPoint: TestPoint | null = null;
    
    switch (mode) {
        case InteractionMode.ADD_POINT_POS:
            newCharge = { id: generateId(), type: 'POINT', position, q: 5, radius: DEFAULTS.POINT_RADIUS, mass: 1 };
            break;
        case InteractionMode.ADD_POINT_NEG:
            newCharge = { id: generateId(), type: 'POINT', position, q: -5, radius: DEFAULTS.POINT_RADIUS, mass: 1 };
            break;
        case InteractionMode.ADD_RING:
            newCharge = { id: generateId(), type: 'RING', position, q: 5, radius: DEFAULTS.RING_RADIUS, mass: 2 };
            break;
        case InteractionMode.ADD_SPHERE_COND:
            newCharge = { id: generateId(), type: 'SPHERE_CONDUCTING', position, q: 5, radius: DEFAULTS.SPHERE_RADIUS, mass: 5 };
            break;
        case InteractionMode.ADD_SPHERE_NONCOND:
            newCharge = { id: generateId(), type: 'SPHERE_NON_CONDUCTING', position, q: 5, radius: DEFAULTS.SPHERE_RADIUS, mass: 5 };
            break;
        case InteractionMode.ADD_TEST_POINT:
            newTestPoint = { id: generateId(), position };
            break;
        default:
            return;
    }

    if (newCharge) {
        setCharges(prev => [...prev, newCharge!]);
    }
    if (newTestPoint) {
        setTestPoints(prev => [...prev, newTestPoint!]);
        setMode(InteractionMode.VIEW);
        setSelectedId(newTestPoint.id);
    }
  }, [mode]);

  const handleSelect = useCallback((id: string) => {
    if (mode === InteractionMode.VIEW || mode === InteractionMode.SELECT) {
        setSelectedId(id);
        setMode(InteractionMode.SELECT);
    }
  }, [mode]);

  const handleDrag = useCallback((id: string, pos: Vector3) => {
    setCharges(prev => {
        const index = prev.findIndex(c => c.id === id);
        if (index === -1) return prev;
        const newCharges = [...prev];
        newCharges[index] = { ...newCharges[index], position: pos, velocity: new Vector3(0,0,0) }; // Reset velocity on drag
        return newCharges;
    });

    setTestPoints(prev => {
        const index = prev.findIndex(t => t.id === id);
        if (index === -1) return prev;
        const newPoints = [...prev];
        newPoints[index] = { ...newPoints[index], position: pos };
        return newPoints;
    });
  }, []);

  const getSelectedObject = () => {
    if (!selectedId) return null;
    return charges.find(c => c.id === selectedId) || testPoints.find(t => t.id === selectedId) || null;
  };

  const updateSelected = useCallback((updates: Partial<ChargeObject> & Partial<TestPoint> & { position?: Vector3 }) => {
    if (!selectedId) return;
    
    setCharges(prev => prev.map(c => {
        if (c.id !== selectedId) return c;
        const newCharge = { ...c };
        if (updates.q !== undefined) newCharge.q = updates.q;
        if (updates.radius !== undefined) newCharge.radius = updates.radius;
        if (updates.mass !== undefined) newCharge.mass = updates.mass;
        if (updates.isFixed !== undefined) newCharge.isFixed = updates.isFixed;
        if (updates.position) newCharge.position = updates.position;
        return newCharge;
    }));

    setTestPoints(prev => prev.map(t => {
        if (t.id !== selectedId) return t;
        const newPoint = { ...t };
        if (updates.position) newPoint.position = updates.position;
        return newPoint;
    }));
  }, [selectedId]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setCharges(prev => prev.filter(c => c.id !== selectedId));
    setTestPoints(prev => prev.filter(t => t.id !== selectedId));
    setSelectedId(null);
    setMode(InteractionMode.VIEW);
  }, [selectedId]);

  const clearAll = () => {
    if(window.confirm("確定要清除所有物件嗎？")) {
        setCharges([]);
        setTestPoints([]);
        setSelectedId(null);
        setIsPlaying(false);
    }
  };

  const resetSimulation = () => {
     setIsPlaying(false);
     setCharges(prev => prev.map(c => ({...c, velocity: new Vector3(0,0,0)})));
  };

  const getSelectedTestPoint = () => {
     return testPoints.find(p => p.id === selectedId) || null;
  };

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden">
      <Controls 
        appMode={appMode}
        setAppMode={setAppMode}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        resetSimulation={resetSimulation}
        mode={mode}
        setMode={(m) => {
            setMode(m);
            setSelectedId(null);
        }}
        config={config}
        setConfig={setConfig}
        selectedObject={getSelectedObject()}
        updateSelected={updateSelected}
        deleteSelected={deleteSelected}
        clearAll={clearAll}
      />
      
      {/* Draggable Observation Panel */}
      <ObservationPanel 
        testPoint={getSelectedTestPoint()}
        charges={charges}
        config={config}
        onClose={() => setSelectedId(null)}
      />

      {appMode === AppMode.STATIC ? (
        <World 
          charges={charges}
          testPoints={testPoints}
          config={config}
          mode={mode}
          selectedId={selectedId}
          onChargeSelect={handleSelect}
          onChargeMove={handleDrag}
          onPlaceObject={handlePlaceObject}
        />
      ) : (
        <DynamicWorld
          charges={charges}
          testPoints={testPoints}
          config={config}
          mode={mode}
          selectedId={selectedId}
          isPlaying={isPlaying}
          onChargeSelect={handleSelect}
          onChargeMove={handleDrag}
          onPlaceObject={handlePlaceObject}
          updateChargesFromSim={setCharges}
        />
      )}
    </div>
  );
}

export default App;
