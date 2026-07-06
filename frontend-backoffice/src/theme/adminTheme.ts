import { createTheme } from '@mui/material/styles';

export const adminTheme = createTheme({
  palette: {
    primary: {
      main: '#1E88E5',
      light: '#42A5F5',
      dark: '#0D47A1',
    },
    secondary: {
      main: '#0D47A1',
    },
    background: {
      default: '#E3F2FD',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1F2937',
      secondary: '#6B7280',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: '#1E88E5',
          '&:hover': {
            backgroundColor: '#0D47A1',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: '#1E88E5',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#1E88E5',
            },
          },
        },
      },
    },
  },
});
