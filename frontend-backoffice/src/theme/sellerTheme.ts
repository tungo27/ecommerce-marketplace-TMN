import { createTheme } from '@mui/material/styles';

export const sellerTheme = createTheme({
  palette: {
    primary: {
      main: '#FF8C42',
      light: '#FFB380',
      dark: '#E67E22',
    },
    secondary: {
      main: '#FFFFFF',
    },
    background: {
      default: '#FF8C42',
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
          backgroundColor: '#FF8C42',
          '&:hover': {
            backgroundColor: '#E67E22',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: '#FF8C42',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#FF8C42',
            },
          },
        },
      },
    },
  },
});
