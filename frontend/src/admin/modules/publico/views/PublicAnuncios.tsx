import { Container, Typography, Box, CircularProgress } from '@mui/material';
import { useState, useEffect } from 'react';
import { parseCsvToJson } from '@/utils/csvUtils';
import { getSys } from '@/utils/settingsCache';

interface Anuncio {
  titulo: string;
  contenido: string;
  fecha?: string;
}

export default function PublicAnuncios() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);

  useEffect(() => {
    loadAnuncios();
  }, []);

  const loadAnuncios = async () => {
    const ssId = getSys('public_ss_id');
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
      
      // Filter to just announcement rows
      const filtered = data.filter((r: any) => r.titulo);
      setAnuncios(filtered);
    } catch (err) {
      setError('Error al cargar anuncios');
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
        Anuncios
      </Typography>
      
      {error && (
        <Typography color="error">{error}</Typography>
      )}

      {!error && anuncios.length === 0 && (
        <Typography color="text.secondary">No hay anuncios</Typography>
      )}

      {anuncios.map((a, i) => (
        <Box key={i} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="h6">{a.titulo}</Typography>
          <Typography variant="body2">{a.contenido}</Typography>
          {a.fecha && (
            <Typography variant="caption" color="text.secondary">
              {a.fecha}
            </Typography>
          )}
        </Box>
      ))}
    </Container>
  );
}
