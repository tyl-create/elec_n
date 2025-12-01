import React from 'react';
import { ChargeObject, TestPoint, SimulationConfig } from '../types';
import { calculateElectricField, calculatePotential, getFieldFromObject } from '../utils/physics';
import { DraggablePanel } from './DraggablePanel';
import { X } from 'lucide-react';

interface ObservationPanelProps {
  testPoint: TestPoint | null;
  charges: ChargeObject[];
  config: SimulationConfig;
  onClose: () => void;
}

export const ObservationPanel: React.FC<ObservationPanelProps> = ({
  testPoint,
  charges,
  config,
  onClose
}) => {
  if (!testPoint) return null;

  const { vector: eVector, magnitude: eMag } = calculateElectricField(testPoint.position, charges, config.k);
  const potential = calculatePotential(testPoint.position, charges, config.k);
  const forceOnUnitCharge = eMag * 1.0; 

  return (
    <DraggablePanel
      initialPos={{ x: window.innerWidth - 260, y: 80 }}
      header={
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-bold text-amber-400">觀測數據</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      }
      className="w-[240px]"
    >
      <div className="text-[10px] font-mono text-white">
           <div className="mb-2 text-[9px] text-slate-400 text-center">
             Position: ({testPoint.position.x.toFixed(2)}, {testPoint.position.y.toFixed(2)}, {testPoint.position.z.toFixed(2)})
           </div>
           
           <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 mb-2">
             <span className="text-pink-300 font-bold">E (電場)</span>
             <span className="text-right font-mono">{eMag.toFixed(2)} N/C</span>
             
             <span className="text-blue-300 font-bold">V (電位)</span>
             <span className="text-right font-mono">{potential.toFixed(2)} V</span>

             <span className="text-green-300 font-bold">F (受力)</span>
             <span className="text-right font-mono">{forceOnUnitCharge.toFixed(2)} N</span>
             <span className="col-span-2 text-[9px] text-slate-500 text-right leading-none mb-1">(*假設 q=+1{config.chargeUnit})</span>
           </div>

           {charges.length > 0 && (
             <div className="mt-2 pt-2 border-t border-slate-700">
               <div className="text-[9px] text-slate-400 mb-1">個別電場貢獻 (N/C):</div>
               <div className="max-h-[120px] overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-600 pr-1">
                 {charges.map(charge => {
                   const field = getFieldFromObject(testPoint.position, charge, config.k);
                   const mag = field.length();
                   return (
                     <div key={charge.id} className="flex justify-between text-[9px] items-center bg-slate-800/50 p-1 rounded">
                       <span className={`font-bold ${charge.q > 0 ? "text-red-400" : "text-blue-400"}`}>
                         {charge.type === 'POINT' ? 'Q' : 'Obj'} ({charge.q})
                       </span>
                       <span className="font-mono">{mag.toFixed(2)}</span>
                     </div>
                   );
                 })}
               </div>
             </div>
           )}
      </div>
    </DraggablePanel>
  );
};
