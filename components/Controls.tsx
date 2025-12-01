
import React, { useState } from 'react';
import { InteractionMode, ChargeObject, SimulationConfig, TestPoint, AppMode } from '../types';
import { MousePointer2, Plus, Minus, ScanEye, Settings2, Trash2, X, Circle, CircleDot, Disc, Play, Pause, RotateCcw, FlaskConical, Atom } from 'lucide-react';
import { Vector3 } from 'three';

interface ControlsProps {
  appMode: AppMode;
  setAppMode: (m: AppMode) => void;
  isPlaying: boolean;
  setIsPlaying: (p: boolean) => void;
  resetSimulation: () => void;
  mode: InteractionMode;
  setMode: (m: InteractionMode) => void;
  config: SimulationConfig;
  setConfig: React.Dispatch<React.SetStateAction<SimulationConfig>>;
  selectedObject: ChargeObject | TestPoint | null;
  updateSelected: (updates: Partial<ChargeObject> & Partial<TestPoint> & { position?: Vector3 }) => void;
  deleteSelected: () => void;
  clearAll: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  appMode,
  setAppMode,
  isPlaying,
  setIsPlaying,
  resetSimulation,
  mode,
  setMode,
  config,
  setConfig,
  selectedObject,
  updateSelected,
  deleteSelected,
  clearAll
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const isCharge = selectedObject && 'q' in selectedObject;
  const chargeObj = selectedObject as ChargeObject;

  const handleCoordinateChange = (axis: 'x' | 'y' | 'z', value: string) => {
    if (!selectedObject) return;
    const num = parseFloat(value);
    if (isNaN(num)) return;
    
    const newPos = selectedObject.position.clone();
    newPos[axis] = num;
    updateSelected({ position: newPos });
  };

  const getChargeLabel = (c: ChargeObject) => {
      switch(c.type) {
          case 'RING': return '帶電圓環';
          case 'SPHERE_CONDUCTING': return '導體球 (Shell)';
          case 'SPHERE_NON_CONDUCTING': return '均勻帶電球';
          case 'POINT': return '點電荷';
          default: return '電荷';
      }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2 sm:p-4 z-10">
      {/* Top Left: Title & Mode Switcher */}
      <div className="pointer-events-auto flex flex-col items-start gap-2">
        <div className="flex items-center gap-2">
            <button 
                onClick={() => setAppMode(appMode === AppMode.STATIC ? AppMode.DYNAMIC : AppMode.STATIC)}
                className="bg-slate-900/80 backdrop-blur-md p-3 rounded-lg border border-slate-700 shadow-xl text-slate-100 hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
                {appMode === AppMode.STATIC ? <FlaskConical className="text-pink-500" size={20}/> : <Atom className="text-cyan-500" size={20}/>}
                <div className="flex flex-col items-start">
                    <h1 className="font-bold text-base leading-none">
                        {appMode === AppMode.STATIC ? '靜電場 3D 實驗室' : '電荷動力學模擬'}
                    </h1>
                    <span className="text-[10px] text-slate-400">點擊切換模式</span>
                </div>
            </button>
            
            {/* Play Controls for Dynamic Mode */}
            {appMode === AppMode.DYNAMIC && (
                <div className="bg-slate-900/80 backdrop-blur-md p-2 rounded-lg border border-slate-700 shadow-xl flex gap-1">
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`p-2 rounded hover:bg-slate-700 transition ${isPlaying ? 'text-amber-400' : 'text-green-400'}`}
                        title={isPlaying ? "暫停" : "開始模擬"}
                    >
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                    </button>
                    <div className="w-px bg-slate-700 mx-1"></div>
                     <button 
                        onClick={resetSimulation}
                        className="p-2 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="重置"
                    >
                        <RotateCcw size={20} />
                    </button>
                </div>
            )}
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-lg backdrop-blur-md border shadow-xl transition-all flex items-center gap-2 ${
            showSettings 
              ? 'bg-slate-700 text-white border-slate-500' 
              : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          {showSettings ? <X size={18} /> : <Settings2 size={18} />}
          <span className="text-xs font-medium">參數設定</span>
        </button>

        {/* Settings Panel */}
        {showSettings && (
          <div className="w-64 bg-slate-900/95 backdrop-blur-xl p-4 rounded-xl border border-slate-600 shadow-2xl animate-in fade-in slide-in-from-left-2 origin-top-left">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Settings2 size={16} /> 參數設定
            </h2>
            
            <div className="space-y-4">
               {/* Toggles */}
              <div className="flex flex-col gap-2">
                  <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer p-2 rounded hover:bg-slate-800 transition">
                      <span>顯示網格</span>
                      <input
                          type="checkbox"
                          checked={config.showGrid}
                          onChange={(e) => setConfig(prev => ({ ...prev, showGrid: e.target.checked }))}
                          className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                      />
                  </label>
                  <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer p-2 rounded hover:bg-slate-800 transition">
                      <span>顯示向量</span>
                      <input
                          type="checkbox"
                          checked={config.showVectors}
                          onChange={(e) => setConfig(prev => ({ ...prev, showVectors: e.target.checked }))}
                          className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                      />
                  </label>
              </div>

              {/* Sliders / Inputs */}
              <div className="space-y-3 pt-2 border-t border-slate-700">
                  <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-wider">
                          <span>向量縮放</span>
                          <span>{config.vectorScale.toFixed(1)}x</span>
                      </div>
                      <input 
                          type="range" 
                          min="0.2" 
                          max="5" 
                          step="0.1" 
                          value={config.vectorScale}
                          onChange={(e) => setConfig(prev => ({...prev, vectorScale: parseFloat(e.target.value)}))}
                          className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer hover:bg-slate-600"
                      />
                  </div>
                   <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-wider">
                          <span>網格間距 ({config.distanceUnit})</span>
                      </div>
                      <input 
                          type="number" 
                          min="0.1" 
                          max="10" 
                          step="0.1" 
                          value={config.gridStep}
                          onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val)) {
                                  setConfig(prev => ({...prev, gridStep: Math.max(0.1, val)}));
                              }
                          }}
                          className="w-full bg-slate-800 text-white text-xs p-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                  </div>
              </div>

              {/* Units */}
              <div className="space-y-3 pt-2 border-t border-slate-700">
                   <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">電荷單位</span>
                          <input 
                              type="text" 
                              value={config.chargeUnit}
                              onChange={(e) => setConfig(prev => ({...prev, chargeUnit: e.target.value}))}
                              className="w-full bg-slate-800 text-white text-xs p-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                              placeholder="e.g. C"
                          />
                      </div>
                      <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">距離單位</span>
                          <input 
                              type="text" 
                              value={config.distanceUnit}
                              onChange={(e) => setConfig(prev => ({...prev, distanceUnit: e.target.value}))}
                              className="w-full bg-slate-800 text-white text-xs p-2 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
                              placeholder="e.g. m"
                          />
                      </div>
                  </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar: Interactions */}
      <div className="flex flex-col gap-4 pointer-events-auto items-center sm:items-stretch sm:flex-row sm:justify-center w-full max-w-4xl mx-auto">
        
        {/* Selection Editor Panel (Compact Mode) */}
        {selectedObject && (
            <div className="bg-slate-800/95 backdrop-blur-md p-3 rounded-xl border border-slate-600 shadow-2xl w-full max-w-md mx-auto animate-in slide-in-from-bottom-5">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                        {isCharge ? <div className={`w-3 h-3 rounded-full ${chargeObj.q > 0 ? 'bg-red-500' : 'bg-blue-500'}`} /> : <ScanEye size={16} className="text-amber-400"/>}
                        {isCharge ? getChargeLabel(chargeObj) : '編輯觀測點'}
                    </h3>
                    <button onClick={() => setMode(InteractionMode.VIEW)} className="text-slate-400 hover:text-white p-1">
                        <X size={16} />
                    </button>
                </div>
                
                <div className="space-y-2">
                    {/* Editable Coordinates */}
                    <div className="grid grid-cols-3 gap-2 text-[10px] text-center font-mono">
                        <div className="flex flex-col gap-0.5">
                           <label className="text-slate-500">X</label>
                           <input 
                              type="number" 
                              step="0.1" 
                              value={selectedObject.position.x} 
                              onChange={(e) => handleCoordinateChange('x', e.target.value)}
                              className="bg-slate-900 rounded p-1 border border-slate-700 text-white w-full text-center focus:border-blue-500 outline-none"
                           />
                        </div>
                        <div className="flex flex-col gap-0.5">
                           <label className="text-slate-500">Y</label>
                           <input 
                              type="number" 
                              step="0.1" 
                              value={selectedObject.position.y} 
                              onChange={(e) => handleCoordinateChange('y', e.target.value)}
                              className="bg-slate-900 rounded p-1 border border-slate-700 text-white w-full text-center focus:border-blue-500 outline-none"
                           />
                        </div>
                        <div className="flex flex-col gap-0.5">
                           <label className="text-slate-500">Z</label>
                           <input 
                              type="number" 
                              step="0.1" 
                              value={selectedObject.position.z} 
                              onChange={(e) => handleCoordinateChange('z', e.target.value)}
                              className="bg-slate-900 rounded p-1 border border-slate-700 text-white w-full text-center focus:border-blue-500 outline-none"
                           />
                        </div>
                    </div>

                    {isCharge && (
                        <div className="space-y-2">
                            <div>
                                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                    <span>電荷量</span>
                                    <span className="text-white font-mono font-bold">
                                        {chargeObj.q} {config.chargeUnit}
                                    </span>
                                </div>
                                <input 
                                    type="range"
                                    min="-20"
                                    max="20"
                                    step="1"
                                    value={chargeObj.q}
                                    onChange={(e) => updateSelected({ q: parseFloat(e.target.value) })}
                                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-[9px] text-slate-500 mt-0.5 font-mono">
                                    <span>-20</span>
                                    <span>0</span>
                                    <span>+20</span>
                                </div>
                            </div>
                            
                            {/* Dynamic Props */}
                            {appMode === AppMode.DYNAMIC && (
                                <div>
                                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                        <span>質量 (kg)</span>
                                        <span className="text-white font-mono font-bold">
                                            {chargeObj.mass || 1.0}
                                        </span>
                                    </div>
                                    <input 
                                        type="range"
                                        min="0.1"
                                        max="10"
                                        step="0.1"
                                        value={chargeObj.mass || 1.0}
                                        onChange={(e) => updateSelected({ mass: parseFloat(e.target.value) })}
                                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <label className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-300">
                                        <input 
                                            type="checkbox" 
                                            checked={!!chargeObj.isFixed}
                                            onChange={(e) => updateSelected({ isFixed: e.target.checked })}
                                            className="rounded border-slate-600 bg-slate-700 w-3 h-3"
                                        />
                                        固定位置 (不移動)
                                    </label>
                                </div>
                            )}
                            
                            {chargeObj.type !== 'POINT' && (
                                <div>
                                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                        <span>半徑 (Radius)</span>
                                        <span className="text-white font-mono font-bold">
                                            {chargeObj.radius?.toFixed(2)} {config.distanceUnit}
                                        </span>
                                    </div>
                                    <input 
                                        type="range"
                                        min="0.2"
                                        max="5"
                                        step="0.1"
                                        value={chargeObj.radius}
                                        onChange={(e) => updateSelected({ radius: parseFloat(e.target.value) })}
                                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <button 
                        onClick={deleteSelected}
                        className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 p-1.5 rounded transition-colors text-xs"
                    >
                        <Trash2 size={14} />
                        刪除
                    </button>
                </div>
            </div>
        )}

        {/* Toolbar */}
        {!selectedObject && (
            <div className="bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-700 shadow-2xl flex gap-1 sm:gap-2 overflow-x-auto w-full justify-between sm:justify-center scrollbar-hide">
                <ToolBtn 
                    active={mode === InteractionMode.VIEW} 
                    onClick={() => setMode(InteractionMode.VIEW)}
                    icon={<MousePointer2 size={22} />}
                    label="選取"
                />
                
                <div className="w-px bg-slate-700 mx-1 shrink-0"></div>

                 <ToolBtn 
                    active={false} 
                    onClick={clearAll}
                    icon={<Trash2 size={22} />}
                    label="清除"
                    color="text-red-500"
                />
                
                <div className="w-px bg-slate-700 mx-1 shrink-0"></div>
                
                {/* Points */}
                <ToolBtn 
                    active={mode === InteractionMode.ADD_POINT_POS} 
                    onClick={() => setMode(InteractionMode.ADD_POINT_POS)}
                    icon={<Plus size={22} />}
                    label="正點電荷"
                    color="text-red-400"
                />
                <ToolBtn 
                    active={mode === InteractionMode.ADD_POINT_NEG} 
                    onClick={() => setMode(InteractionMode.ADD_POINT_NEG)}
                    icon={<Minus size={22} />}
                    label="負點電荷"
                    color="text-blue-400"
                />

                <div className="w-px bg-slate-700 mx-1 shrink-0"></div>

                {/* Extended Shapes */}
                <ToolBtn 
                    active={mode === InteractionMode.ADD_RING} 
                    onClick={() => setMode(InteractionMode.ADD_RING)}
                    icon={<CircleDot size={22} />}
                    label="帶電環"
                    color="text-green-400"
                />
                <ToolBtn 
                    active={mode === InteractionMode.ADD_SPHERE_COND} 
                    onClick={() => setMode(InteractionMode.ADD_SPHERE_COND)}
                    icon={<Disc size={22} />}
                    label="導體球"
                    color="text-cyan-400"
                />
                 <ToolBtn 
                    active={mode === InteractionMode.ADD_SPHERE_NONCOND} 
                    onClick={() => setMode(InteractionMode.ADD_SPHERE_NONCOND)}
                    icon={<Circle size={22} />}
                    label="非導體球"
                    color="text-indigo-400"
                />
                
                <div className="w-px bg-slate-700 mx-1 shrink-0"></div>
                
                {/* Sensor */}
                <ToolBtn 
                    active={mode === InteractionMode.ADD_TEST_POINT} 
                    onClick={() => setMode(InteractionMode.ADD_TEST_POINT)}
                    icon={<ScanEye size={22} />}
                    label="觀測點"
                    color="text-amber-400"
                />
            </div>
        )}
      </div>
    </div>
  );
};

const ToolBtn: React.FC<{
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    color?: string;
}> = ({ active, onClick, icon, label, color = "text-slate-200" }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center min-w-[65px] sm:min-w-[70px] py-2 px-1 rounded-xl transition-all active:scale-95 whitespace-nowrap ${
            active 
            ? 'bg-slate-800 shadow-inner ring-1 ring-slate-600' 
            : 'hover:bg-slate-800/50'
        }`}
    >
        <div className={`${active ? color : 'text-slate-400'} mb-1`}>{icon}</div>
        <span className={`text-[10px] font-medium ${active ? 'text-white' : 'text-slate-500'}`}>{label}</span>
    </button>
);
