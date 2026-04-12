import { Container, Typography, Box, CircularProgress } from '@mui/material';
import { useState, useEffect } from 'react';
import { parseCsvToJson } from '@/utils/csvUtils';

const PUBLIC_SS_ID_KEY = 'congre_public_ss_id';

interface Reunione {
  dia: string;
  hora: string;
  tipo: string;
  observaciones?: string;
}

export default function PublicReuniones() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reuniones, setReuniones] = useState<Reunione[]>([]);

  useEffect(() => {
    loadReuniones();
  }, []);

  const loadReuniones = async () => {
    const ssId = localStorage.getItem(PUBLIC_SS_ID_KEY);
    if (!ssId) {
      // Let modal handle this - just show loading until modal appears
      setLoading(false);
      return;
    }

    try {
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${ssId}/gviz/tq?tqx=out:csv&sheet=Publico`;
      const response = await fetch(gvizUrl);
      const csvText = await response.text();
      const data = parseCsvToJson(csvText);
      
      // Filter to just reunion rows
      const filtered = data.filter((r: any) => r.tipo && r.dia);
      setReuniones(filtered);
    } catch (err) {
      setError('Error al cargar reuniones');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        Reuniones
      </Typography>
      
      {error && (
        <Typography color="error">{error}</Typography>
      )}

      {!error && reuniones.length === 0 && (
        <Typography color="text.secondary">No hay reuniones programadas</Typography>
      )}

      {reuniones.map((r, i) => (
        <Box key={i} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="h6">{r.dia}</Typography>
          <Typography variant="body2" color="text.secondary">
            {r.hora} - {r.tipo}
          </Typography>
          {r.observaciones && (
            <Typography variant="body2">{r.observaciones}</Typography>
          )}
        </Box>
      ))}
    </Container>
  );
}
