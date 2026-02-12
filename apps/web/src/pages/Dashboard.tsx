import { Box, Grid, Card, CardContent, Typography, CircularProgress, Chip, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Receipt, AttachMoney, TrendingUp } from '@mui/icons-material';
import { useCurrentPeriod, useInvoices, usePeriodStats } from '../hooks/useApi';
import { useAuth } from '../stores/auth.context';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: currentPeriod, isLoading: periodLoading } = useCurrentPeriod();
  const { data: invoices, isLoading: invoicesLoading } = useInvoices(currentPeriod?.id);
  const { data: stats, isLoading: statsLoading } = usePeriodStats(currentPeriod?.id || '');

  const userShare = stats?.userShares.find((share) => share.userId === user?.id);

  if (periodLoading || invoicesLoading || statsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('dashboard.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('dashboard.currentPeriod')}: {currentPeriod?.name || t('common.noData')}
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Receipt color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {t('dashboard.totalInvoices')}
                </Typography>
              </Box>
              <Typography variant="h4">{stats?.totalInvoices || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {t('dashboard.totalAmount')}
                </Typography>
              </Box>
              <Typography variant="h4">
                {formatCurrency(stats?.totalAmountCents || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp color="primary" />
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {t('dashboard.yourShare')}
                </Typography>
              </Box>
              <Typography variant="h4">
                {formatCurrency(userShare?.totalShareCents || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {t('dashboard.periodStatus')}
                </Typography>
              </Box>
              <Chip
                label={currentPeriod?.status === 'OPEN' ? t('period.open') : t('period.closed')}
                color={currentPeriod?.status === 'OPEN' ? 'success' : 'default'}
                size="medium"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Invoices */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{t('dashboard.recentInvoices')}</Typography>
            <Button onClick={() => navigate('/invoices')}>{t('dashboard.viewAll')}</Button>
          </Box>

          {!invoices || invoices.length === 0 ? (
            <Typography color="text.secondary">{t('common.noData')}</Typography>
          ) : (
            <Box>
              {invoices.slice(0, 5).map((invoice) => (
                <Box
                  key={invoice.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                >
                  <Box>
                    <Typography variant="body1">{invoice.description}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(invoice.invoiceDate)} • {invoice.category}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body1" fontWeight="medium">
                      {formatCurrency(invoice.totalAmountCents)}
                    </Typography>
                    <Chip
                      label={invoice.distributionMethod}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
