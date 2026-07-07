import { CssBaseline, ThemeProvider, createTheme, Box, AppBar, Toolbar, Typography } from '@mui/material';
// import { ImageUpload } from './components/ImageUpload';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f4f6f8',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
        <AppBar position="static" elevation={1}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              Backoffice -  TMN
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 4 }}>
          {/* <ImageUpload /> */}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
