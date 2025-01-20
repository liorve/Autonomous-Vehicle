import { Typography, Box } from "@mui/material";
import DirectionsCarSharpIcon from "@mui/icons-material/DirectionsCarSharp"; 

const Logo = () => {
  return (
    <Box display="flex" alignItems="center">
      <DirectionsCarSharpIcon sx={{ mr: 1, mb: 0.5 }} />
      <Typography variant="h6">Talide</Typography>
    </Box>
  );
};

export default Logo;
