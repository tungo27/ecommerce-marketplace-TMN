import { createTheme } from '@mui/material/styles';

export const sellerTheme = createTheme({
  palette: {
    primary: {
      main: '#FF4742', // New modern Orange-Red brand color
      light: '#FFECEB',
      dark: '#E03E39',
    },
    secondary: {
      main: '#111827', // Gray 900
    },
    background: {
      default: '#F9FAFB', // Gray 50
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#4B5563', // Gray 600
    },
    divider: '#E5E7EB',
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 800,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true, // Flat design
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 24px',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: '1px solid #E5E7EB',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#FFFFFF',
            '&:hover fieldset': {
              borderColor: '#FF4742',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#FF4742',
            },
          },
        },
      },
    },
  },
});
