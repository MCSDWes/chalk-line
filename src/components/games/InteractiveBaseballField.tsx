import React, { useState } from 'react';

interface InteractiveBaseballFieldProps {
  onLocationClick: (x: number, y: number, zone: string) => void;
  hitType?: '1B' | '2B' | '3B' | 'HR';
  isSelecting: boolean;
}

export const InteractiveBaseballField: React.FC<InteractiveBaseballFieldProps> = ({
  onLocationClick,
  hitType,
  isSelecting
}) => {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // Define field zones for spray chart analysis
  const zones = [
    { id: 'left-foul', name: 'Left Foul Territory', path: 'M 50 350 L 50 200 L 140 110 L 80 160 Z', color: '#f3f4f6' },
    { id: 'left-field', name: 'Left Field', path: 'M 80 160 L 140 110 L 200 80 L 150 150 Z', color: '#dcfce7' },
    { id: 'left-center', name: 'Left Center', path: 'M 150 150 L 200 80 L 250 80 L 200 150 Z', color: '#bbf7d0' },
    { id: 'center-field', name: 'Center Field', path: 'M 200 150 L 250 80 L 300 80 L 250 150 Z', color: '#86efac' },
    { id: 'right-center', name: 'Right Center', path: 'M 250 150 L 300 80 L 360 110 L 300 150 Z', color: '#bbf7d0' },
    { id: 'right-field', name: 'Right Field', path: 'M 300 150 L 360 110 L 420 160 L 350 150 Z', color: '#dcfce7' },
    { id: 'right-foul', name: 'Right Foul Territory', path: 'M 350 150 L 420 160 L 450 200 L 450 350 Z', color: '#f3f4f6' },
    { id: 'shortstop', name: 'Shortstop Area', path: 'M 150 200 L 200 150 L 250 150 L 200 200 Z', color: '#fed7aa' },
    { id: 'second-base', name: 'Second Base Area', path: 'M 200 200 L 250 150 L 300 150 L 250 200 Z', color: '#fed7aa' },
    { id: 'third-base', name: 'Third Base Area', path: 'M 100 250 L 150 200 L 200 200 L 150 250 Z', color: '#fde68a' },
    { id: 'first-base', name: 'First Base Area', path: 'M 250 200 L 300 150 L 350 200 L 300 250 Z', color: '#fde68a' },
    { id: 'pitcher-mound', name: 'Pitcher Mound', path: 'M 190 240 L 210 240 L 210 260 L 190 260 Z', color: '#d97706' },
    { id: 'infield', name: 'Infield', path: 'M 150 250 L 200 200 L 250 200 L 300 250 L 250 300 L 200 300 Z', color: '#fbbf24' }
  ];

  const handleZoneClick = (e: React.MouseEvent<SVGElement>, zone: any) => {
    if (!isSelecting) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const svg = e.currentTarget.closest('svg')?.getBoundingClientRect();
    if (!svg) return;
    
    const x = ((e.clientX - rect.left) / rect.width) * 500;
    const y = ((e.clientY - rect.top) / rect.height) * 400;
    
    onLocationClick(x, y, zone.id);
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${isSelecting ? 'cursor-crosshair' : ''}`}>
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h3 className="text-lg font-bold text-center mb-4">
          {isSelecting ? (
            <span className="text-blue-600">
              Click where the {hitType === '1B' ? 'single' : hitType === '2B' ? 'double' : hitType === '3B' ? 'triple' : 'home run'} was hit
            </span>
          ) : (
            'Baseball Field - Spray Chart'
          )}
        </h3>
        
        <svg viewBox="0 0 500 400" className="w-full h-auto border rounded">
          {/* Field Background */}
          <rect width="500" height="400" fill="#22c55e" />
          
          {/* Field Zones */}
          {zones.map(zone => (
            <path
              key={zone.id}
              d={zone.path}
              fill={hoveredZone === zone.id ? '#3b82f6' : zone.color}
              stroke="#374151"
              strokeWidth="1"
              className={`transition-colors ${isSelecting ? 'cursor-crosshair hover:opacity-80' : ''}`}
              onMouseEnter={() => setHoveredZone(zone.id)}
              onMouseLeave={() => setHoveredZone(null)}
              onClick={(e) => handleZoneClick(e, zone)}
            />
          ))}
          
          {/* Baseball Diamond */}
          <polygon
            points="200,320 320,200 200,80 80,200"
            fill="#8b4513"
            stroke="#6b2c0e"
            strokeWidth="2"
          />
          
          {/* Bases */}
          <rect x="75" y="195" width="10" height="10" fill="white" stroke="#374151" strokeWidth="1" />
          <rect x="195" y="75" width="10" height="10" fill="white" stroke="#374151" strokeWidth="1" />
          <rect x="315" y="195" width="10" height="10" fill="white" stroke="#374151" strokeWidth="1" />
          <path d="M 190 310 L 200 320 L 210 310 L 200 300 Z" fill="white" stroke="#374151" strokeWidth="1" />
          
          {/* Pitcher's Mound */}
          <circle cx="200" cy="250" r="8" fill="#8b4513" stroke="#6b2c0e" strokeWidth="1" />
          
          {/* Base Labels */}
          <text x="60" y="190" fontSize="10" fill="#374151" fontWeight="bold">3B</text>
          <text x="190" y="70" fontSize="10" fill="#374151" fontWeight="bold">2B</text>
          <text x="330" y="190" fontSize="10" fill="#374151" fontWeight="bold">1B</text>
          <text x="180" y="340" fontSize="10" fill="#374151" fontWeight="bold">HOME</text>
          
          {/* Foul Lines */}
          <line x1="200" y1="320" x2="50" y2="50" stroke="#fbbf24" strokeWidth="2" />
          <line x1="200" y1="320" x2="450" y2="50" stroke="#fbbf24" strokeWidth="2" />
          
          {/* Warning Track (optional) */}
          <path 
            d="M 70 140 Q 200 40 430 140" 
            fill="none" 
            stroke="#a3a3a3" 
            strokeWidth="2" 
            strokeDasharray="5,5" 
          />
        </svg>
        
        {/* Zone Legend */}
        {isSelecting && (
          <div className="mt-4 text-sm text-gray-600">
            <p className="font-semibold mb-2">Spray Chart Zones:</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-200 border"></div>
                <span>Outfield</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-200 border"></div>
                <span>Infield</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-200 border"></div>
                <span>Base Areas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 border"></div>
                <span>Foul Territory</span>
              </div>
            </div>
          </div>
        )}
        
        {hoveredZone && (
          <div className="mt-2 text-center text-sm font-medium text-blue-600">
            {zones.find(z => z.id === hoveredZone)?.name}
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveBaseballField;