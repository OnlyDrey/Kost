import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useEffect, useMemo } from 'react';
import { AuthProvider } from './stores/auth.context';
import { SettingsProvider, useSettings } from './stores/settings.context';
import AppRoutes from './routes';
import { useTranslation } from 'react-i18next';

function AppContent() {
  const { settings } = useSettings();
  const { i18n } = useTranslation();

  // Update i18n language when settings change
  useEffect(() => {
    i18n.changeLanguage(settings.locale);
  }, [settings.locale, i18n]);

  // Create theme based on settings
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: settings.theme,
          primary: {
            main: '#1976d2',
            light: '#42a5f5',
            dark: '#1565c0',
          },
          secondary: {
            main: '#dc004e',
            light: '#e33371',
            dark: '#9a0036',
          },
          background: {
            default: settings.theme === 'dark' ? '#121212' : '#f5f5f5',
            paper: settings.theme === 'dark' ? '#1e1e1e' : '#ffffff',
          },
        },
        typography: {
          fontFamily: 'Roboto, sans-serif',
          h4: {
            fontWeight: 600,
          },
          h5: {
            fontWeight: 600,
          },
          h6: {
            fontWeight: 600,
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: 8,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
              },
            },
          },
        },
      }),
    [settings.theme]
  );

  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App;
