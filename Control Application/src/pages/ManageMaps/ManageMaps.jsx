import { Grid, Divider } from "@mui/material";

import AddMap from "../../Components/AddMap/AddMap";
import AllMapsDisplay from "../../Components/AllMapsDisplay/AllMapsDisplay";

const ManageMaps = () => {
  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <AddMap />
      </Grid>
      <Grid item xs={12}>
        <Divider />
      </Grid>
      <Grid item xs={12}>
        <AllMapsDisplay />
      </Grid>
    </Grid>
  );
};

export default ManageMaps;
