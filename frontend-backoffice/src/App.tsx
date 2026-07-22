import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { RouterProvider } from 'react-router-dom';
import { Snackbar, Alert } from '@mui/material';
import { router } from './router';
import { sellerTheme } from './theme/sellerTheme';
import { useNotificationStore } from './stores/notificationStore';

function App() {
  const { open, message, severity, closeNotification } = useNotificationStore();

  return (
    <ThemeProvider theme={sellerTheme}>
      <CssBaseline />
      <RouterProvider router={router} />

      {/* Toast thông báo toàn cục (NFR UX) */}
      <Snackbar
        open={open}
        autoHideDuration={5000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={closeNotification} severity={severity} variant="filled" sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;
