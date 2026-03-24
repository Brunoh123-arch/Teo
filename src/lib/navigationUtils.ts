export const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  const brng = Math.atan2(y, x);
  return (brng * 180 / Math.PI + 360) % 360;
};

export const getInstruction = (bearing1: number, bearing2: number) => {
  const diff = (bearing2 - bearing1 + 540) % 360 - 180;
  if (diff > 30) return "Vire à direita";
  if (diff < -30) return "Vire à esquerda";
  return "Siga em frente";
};
