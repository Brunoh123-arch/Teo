import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // Wait, I don't see react-router-dom in imports.
// I should just use window.location.pathname or pass it as a prop.
// Let's just create a component that takes the rideId as a prop.

interface ShareRideViewProps {
  rideId: string;
}

export const ShareRideView: React.FC<ShareRideViewProps> = ({ rideId }) => {
  const [rideData, setRideData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/v1/rides/${rideId}/share`)
      .then(res => res.json())
      .then(data => {
        setRideData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [rideId]);

  if (loading) return <div className="p-4">Carregando...</div>;
  if (!rideData) return <div className="p-4">Corrida não encontrada ou compartilhamento expirado.</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Acompanhando Viagem</h2>
      <p>Status: {rideData.status}</p>
      <p>Origem: {rideData.originName}</p>
      <p>Destino: {rideData.destName}</p>
      {/* Add map here if possible, but for now just text */}
    </div>
  );
};
