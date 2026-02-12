import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  Alert,
} from '@mui/material';
import { ArrowBack, Add, Delete } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useCreateInvoice } from '../../hooks/useApi';
import { useAuth } from '../../stores/auth.context';
import { centsToAmount, amountToCents } from '../../utils/currency';

interface CustomShare {
  userId: string;
  amount: string;
}

export default function AddInvoice() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const createInvoice = useCreateInvoice();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [distributionMethod, setDistributionMethod] = useState<'EQUAL' | 'CUSTOM' | 'INCOME_BASED'>('EQUAL');
  const [category, setCategory] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [customShares, setCustomShares] = useState<CustomShare[]>([]);
  const [error, setError] = useState('');

  // Mock family members - in real app, fetch from API
  const familyMembers = [
    { id: user?.id || '1', name: user?.name || 'You' },
    { id: '2', name: 'Partner' },
  ];

  const handleAddShare = () => {
    setCustomShares([...customShares, { userId: '', amount: '' }]);
  };

  const handleRemoveShare = (index: number) => {
    setCustomShares(customShares.filter((_, i) => i !== index));
  };

  const handleShareChange = (index: number, field: 'userId' | 'amount', value: string) => {
    const newShares = [...customShares];
    newShares[index] = { ...newShares[index], [field]: value };
    setCustomShares(newShares);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!description.trim()) {
      setError(t('validation.required'));
      return;
    }

    const totalAmountCents = amountToCents(parseFloat(amount));
    if (isNaN(totalAmountCents) || totalAmountCents <= 0) {
      setError(t('validation.invalidAmount'));
      return;
    }

    // Validate custom shares
    let customSharesData: Array<{ userId: string; shareCents: number }> | undefined;
    if (distributionMethod === 'CUSTOM') {
      if (customShares.length === 0) {
        setError('Please add at least one custom share');
        return;
      }

      customSharesData = customShares.map(share => ({
        userId: share.userId,
        shareCents: amountToCents(parseFloat(share.amount))
      }));

      const totalCustom = customSharesData.reduce((sum, s) => sum + s.shareCents, 0);
      if (totalCustom !== totalAmountCents) {
        setError(`Custom shares (${centsToAmount(totalCustom)} kr) must equal total amount (${centsToAmount(totalAmountCents)} kr)`);
        return;
      }
    }

    try {
      await createInvoice.mutateAsync({
        description,
        totalAmountCents,
        distributionMethod,
        category: category || undefined,
        paidBy: user?.id,
        invoiceDate,
        dueDate: dueDate || undefined,
        customShares: customSharesData,
      });

      navigate('/invoices');
    } catch (err) {
      setError(t('errors.serverError'));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/invoices')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">{t('invoice.addInvoice')}</Typography>
      </Box>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label={t('invoice.description')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Electricity bill"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label={t('invoice.amount')}
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputProps={{ step: '0.01', min: '0' }}
                  helperText="Amount in kr"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('invoice.category')}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Utilities"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label={t('invoice.invoiceDate')}
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('invoice.dueDate')}
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  select
                  label={t('invoice.distributionMethod')}
                  value={distributionMethod}
                  onChange={(e) => setDistributionMethod(e.target.value as any)}
                >
                  <MenuItem value="EQUAL">{t('invoice.equal')}</MenuItem>
                  <MenuItem value="CUSTOM">{t('invoice.custom')}</MenuItem>
                  <MenuItem value="INCOME_BASED">{t('invoice.incomeBased')}</MenuItem>
                </TextField>
              </Grid>

              {/* Custom Shares */}
              {distributionMethod === 'CUSTOM' && (
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      {t('invoice.customShares')}
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={handleAddShare}
                      size="small"
                    >
                      {t('invoice.addShare')}
                    </Button>
                  </Box>

                  {customShares.map((share, index) => (
                    <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={5}>
                        <TextField
                          fullWidth
                          select
                          label={t('invoice.selectUser')}
                          value={share.userId}
                          onChange={(e) => handleShareChange(index, 'userId', e.target.value)}
                          required
                        >
                          {familyMembers.map((member) => (
                            <MenuItem key={member.id} value={member.id}>
                              {member.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={5}>
                        <TextField
                          fullWidth
                          label={t('invoice.shareAmount')}
                          type="number"
                          value={share.amount}
                          onChange={(e) => handleShareChange(index, 'amount', e.target.value)}
                          inputProps={{ step: '0.01', min: '0' }}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <IconButton
                          color="error"
                          onClick={() => handleRemoveShare(index)}
                        >
                          <Delete />
                        </IconButton>
                      </Grid>
                    </Grid>
                  ))}
                </Grid>
              )}

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button variant="outlined" onClick={() => navigate('/invoices')}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={createInvoice.isPending}
                  >
                    {t('invoice.save')}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
