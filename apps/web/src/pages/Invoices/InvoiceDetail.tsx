import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Chip,
  Grid,
  Divider,
  IconButton,
} from '@mui/material';
import { ArrowBack, Delete, Edit } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useInvoice, useDeleteInvoice } from '../../hooks/useApi';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import AllocationExplanation from '../../components/Invoice/AllocationExplanation';

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: invoice, isLoading } = useInvoice(id!);
  const deleteInvoice = useDeleteInvoice();

  const handleDelete = async () => {
    if (confirm(t('invoice.confirmDelete'))) {
      await deleteInvoice.mutateAsync(id!);
      navigate('/invoices');
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box>
        <Typography variant="h6">{t('errors.notFound')}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/invoices')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ flex: 1 }}>
          {t('invoice.title')}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Edit />}
          onClick={() => navigate(`/invoices/${id}/edit`)}
          sx={{ mr: 1 }}
        >
          {t('common.edit')}
        </Button>
        <Button
          variant="outlined"
          color="error"
          startIcon={<Delete />}
          onClick={handleDelete}
        >
          {t('common.delete')}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Main Info */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {invoice.description}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Chip
                  label={invoice.distributionMethod}
                  color="primary"
                  variant="outlined"
                />
                {invoice.category && <Chip label={invoice.category} variant="outlined" />}
                <Chip
                  label={invoice.status}
                  color={invoice.status === 'APPROVED' ? 'success' : 'default'}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    {t('invoice.totalAmount')}
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {formatCurrency(invoice.totalAmountCents)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    {t('invoice.invoiceDate')}
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(invoice.invoiceDate)}
                  </Typography>
                </Grid>
                {invoice.dueDate && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t('invoice.dueDate')}
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(invoice.dueDate)}
                    </Typography>
                  </Grid>
                )}
                {invoice.uploader && (
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      {t('invoice.paidBy')}
                    </Typography>
                    <Typography variant="body1">{invoice.uploader.name}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Allocation Explanation */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('invoice.allocationExplanation')}
              </Typography>
              <AllocationExplanation invoice={invoice} />
            </CardContent>
          </Card>
        </Grid>

        {/* Shares */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('invoice.shares')}
              </Typography>
              <Divider sx={{ my: 2 }} />
              {invoice.shares && invoice.shares.length > 0 ? (
                <Grid container spacing={2}>
                  {invoice.shares.map((share) => (
                    <Grid item xs={12} sm={6} md={4} key={share.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="body1" fontWeight="medium">
                            {share.user?.name || 'Unknown'}
                          </Typography>
                          <Typography variant="h6" color="primary">
                            {formatCurrency(share.shareCents)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {share.percentageShare.toFixed(2)}%
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography color="text.secondary">{t('common.noData')}</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
