import NavBar from "./Components/NavBar/NavBar";
import { Grid } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  components: {
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: "14px",
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Grid container sx={{ fontFamily: "Arial" }}>
        <NavBar />
      </Grid>
    </ThemeProvider>
  );
}

export default App;
