import { useState } from "react";
import axios from "axios";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CustomSnackbar from "../CustomSnackbar/CustomSnackbar";

const AllMapsDisplay = () => {
  const queryClient = useQueryClient();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const fetchMaps = async () => {
    const { data } = await axios.get("http://localhost:5000/api/maps");
    return data;
  };

  const {
    data: maps,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["maps"],
    queryFn: fetchMaps,
  });

  const handleDelete = (mapId) => {
    axios
      .delete(`http://localhost:5000/api/maps/delete/${mapId}`)
      .then((response) => {
        console.log(`Map with ID ${mapId} deleted successfully.`);
        queryClient.invalidateQueries("maps");

        // Show snackbar message
        setSnackbarSeverity("success");
        setSnackbarMessage("Map deleted successfully");
        setSnackbarOpen(true);
      })
      .catch((error) => {
        console.error(`Error deleting map with ID ${mapId}:`, error);
      });
  };

  if (isLoading) {
    return <Typography variant="h6">Loading maps...</Typography>;
  }

  if (error) {
    return (
      <Typography variant="h6">Error fetching maps: {error.message}</Typography>
    );
  }

  return (
    <Grid container spacing={2} alignItems="flex-start">
      <Grid item xs={12}>
        <Typography variant="h5" gutterBottom>
          All available maps
        </Typography>
      </Grid>
      {maps.map((map, index) => (
        <Grid item key={map.id} xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" component="div">
                Map ID: {map.id}
              </Typography>
              <Typography variant="h6" component="div">
                Map Name: Map {index + 1}
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                Creation Time:{" "}
                {new Intl.DateTimeFormat("en-UK", {
                  weekday: "long",
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false, // Use 24-hour format
                }).format(new Date("2024-08-10T12:17:43.578000"))}
              </Typography>
              <Typography variant="body2">
                <strong>Data:</strong>
              </Typography>
              <List>
                {map.data.map((item) => (
                  <ListItem key={item.id}>
                    <ListItemText primary={`Vertex ${item.id}`} />
                    <Typography variant="body2">
                      {item.edges.map((edge, index) => (
                        <span key={index}>
                          {edge.vertex} connected from {edge.direction}
                          {index !== item.edges.length - 1 && ", "}
                        </span>
                      ))}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleDelete(map.id)}
              >
                Delete
              </Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
      <CustomSnackbar
        open={snackbarOpen}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        severity={snackbarSeverity}
      />
    </Grid>
  );
};

export default AllMapsDisplay;
