import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import { Add, Lock } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { usePeriods, useCreatePeriod, useClosePeriod } from '../../hooks/useApi';
import { useAuth } from '../../stores/auth.context';
import { formatDate } from '../../utils/date';

export default function PeriodList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const { data: periods, isLoading } = usePeriods();
  const createPeriod = useCreatePeriod();
  const closePeriod = useClosePeriod();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const handleCreatePeriod = async () => {
    setError('');

    if (!name.trim() || !startDate || !endDate) {
      setError(t('validation.required'));
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError('Start date must be before end date');
      return;
    }

    try {
      await createPeriod.mutateAsync({ name, startDate, endDate });
      setCreateDialogOpen(false);
      setName('');
      setStartDate('');
      setEndDate('');
    } catch (err) {
      setError(t('errors.serverError'));
    }
  };

  const handleClosePeriod = async (id: string) => {
    if (confirm(t('period.confirmClose'))) {
      try {
        await closePeriod.mutateAsync(id);
      } catch (err) {
        alert(t('errors.serverError'));
      }
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{t('period.periods')}</Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            {t('period.createPeriod')}
          </Button>
        )}
      </Box>

      {!periods || periods.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" align="center">
              {t('common.noData')}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {periods.map((period) => (
            <Grid item xs={12} key={period.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {period.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip
                          label={period.status}
                          color={period.status === 'OPEN' ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(period.startDate)} - {formatDate(period.endDate)}
                      </Typography>
                      {period.closedAt && (
                        <Typography variant="caption" color="text.secondary">
                          Closed: {formatDate(period.closedAt)}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        onClick={() => navigate(`/periods/${period.id}`)}
                      >
                        {t('period.stats')}
                      </Button>
                      {isAdmin && period.status === 'OPEN' && (
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<Lock />}
                          onClick={() => handleClosePeriod(period.id)}
                        >
                          {t('period.closePeriod')}
                        </Button>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Period Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('period.createPeriod')}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label={t('period.name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., January 2024"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label={t('period.startDate')}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label={t('period.endDate')}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={handleCreatePeriod}
            variant="contained"
            disabled={createPeriod.isPending}
          >
            {t('common.add')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
