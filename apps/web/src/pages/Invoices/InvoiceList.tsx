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
  TextField,
  MenuItem,
  Grid,
  IconButton,
} from '@mui/material';
import { Add, Visibility } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useInvoices, useCurrentPeriod } from '../../hooks/useApi';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import { Invoice } from '../../services/api';

export default function InvoiceList() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: currentPeriod } = useCurrentPeriod();
  const { data: invoices, isLoading } = useInvoices(currentPeriod?.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');

  const filteredInvoices = invoices?.filter((invoice) => {
    const matchesSearch = invoice.description
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesMethod =
      filterMethod === 'ALL' || invoice.distributionMethod === filterMethod;
    return matchesSearch && matchesMethod;
  });

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
        <Typography variant="h4">{t('invoice.invoices')}</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/invoices/add')}
        >
          {t('invoice.addInvoice')}
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('invoice.description')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label={t('invoice.distributionMethod')}
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
              >
                <MenuItem value="ALL">{t('common.filter')}</MenuItem>
                <MenuItem value="EQUAL">{t('invoice.equal')}</MenuItem>
                <MenuItem value="CUSTOM">{t('invoice.custom')}</MenuItem>
                <MenuItem value="INCOME_BASED">{t('invoice.incomeBased')}</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Invoice List */}
      {!filteredInvoices || filteredInvoices.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" align="center">
              {t('common.noData')}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {filteredInvoices.map((invoice) => (
            <Grid item xs={12} key={invoice.id}>
              <Card sx={{ cursor: 'pointer' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {invoice.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        <Chip
                          label={invoice.distributionMethod}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        {invoice.category && (
                          <Chip label={invoice.category} size="small" variant="outlined" />
                        )}
                        <Chip
                          label={invoice.status}
                          size="small"
                          color={invoice.status === 'APPROVED' ? 'success' : 'default'}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('invoice.invoiceDate')}: {formatDate(invoice.invoiceDate)}
                      </Typography>
                      {invoice.uploader && (
                        <Typography variant="body2" color="text.secondary">
                          {t('invoice.paidBy')}: {invoice.uploader.name}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h5" color="primary">
                          {formatCurrency(invoice.totalAmountCents)}
                        </Typography>
                      </Box>
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/invoices/${invoice.id}`)}
                      >
                        <Visibility />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
