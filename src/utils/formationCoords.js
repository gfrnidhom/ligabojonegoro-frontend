export function calculateCoordinates(formation) {
  // Returns an array of {x, y} relative coordinates (0 to 100) for 11 players
  // x: 0 (left) to 100 (right)
  // y: 0 is the midline, y: 100 is their own goal line.
  
  const defaultCoords = [
    { x: 50, y: 92 }, // GK
    { x: 80, y: 70 }, { x: 65, y: 75 }, { x: 35, y: 75 }, { x: 20, y: 70 }, // DEF
    { x: 80, y: 40 }, { x: 60, y: 45 }, { x: 40, y: 45 }, { x: 20, y: 40 }, // MID
    { x: 60, y: 15 }, { x: 40, y: 15 } // FWD
  ];

  if (!formation) return defaultCoords;

  const parts = formation.split('-').map(n => parseInt(n)).filter(n => !isNaN(n));
  if (parts.reduce((a, b) => a + b, 0) !== 10) return defaultCoords;

  const coords = [{ x: 50, y: 92 }]; // GK

  // Distribute rows between y=75 and y=15
  const rowCount = parts.length;
  const yStep = (75 - 15) / Math.max(1, rowCount - 1);

  parts.forEach((count, rowIndex) => {
    const y = 75 - (rowIndex * yStep);
    
    // Distribute x evenly
    for (let i = 0; i < count; i++) {
      let x = 50;
      if (count > 1) {
        const spread = Math.min(80, count * 18); // Max spread 80%
        const startX = 50 - (spread / 2);
        const xStep = spread / (count - 1);
        x = startX + (i * xStep);
      }
      coords.push({ x, y });
    }
  });

  return coords;
}
