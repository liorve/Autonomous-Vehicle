import { useState } from "react";
import {
  TextField,
  Button,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import CustomSnackbar from "../../Components/CustomSnackbar/CustomSnackbar";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

const AddMap = () => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm(); // Initialize useForm

  const [vertices, setVertices] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const onSubmit = (data) => {
    const { vertexId, connectedVertexId, direction } = data;

    const updatedVertices = vertices.map((vertex) => {
      if (vertex.id === vertexId) {
        const existingEdgeIndex = vertex.edges.findIndex(
          (edge) => edge.vertex === connectedVertexId
        );
        if (existingEdgeIndex !== -1) {
          setSnackbarSeverity("error");
          setSnackbarMessage("An edge with this vertex already exists.");
          setSnackbarOpen(true);
          return vertex;
        }

        return {
          ...vertex,
          edges: [
            ...vertex.edges,
            {
              vertex: connectedVertexId,
              direction: direction,
            },
          ],
        };
      } else {
        return vertex;
      }
    });

    const existingVertex = vertices.find((vertex) => vertex.id === vertexId);
    if (!existingVertex) {
      setVertices([
        ...vertices,
        {
          id: vertexId,
          edges: [{ vertex: connectedVertexId, direction: direction }],
        },
      ]);
    } else {
      setVertices(updatedVertices);
    }

    setSnackbarSeverity("success");
    setSnackbarMessage("Edge added successfully");
    setSnackbarOpen(true);

    resetForm();
  };

  const resetForm = () => {
    reset({
      vertexId: "",
      connectedVertexId: "",
      direction: "",
    });
  };

  const handleSaveMap = async () => {
    try {
      console.log(vertices);

      // Make sure vertices is not empty
      if (vertices.length === 0) {
        console.error("Vertices array is empty.");
        return;
      }

      const response = await axios.post(
        "http://localhost:5000/api/maps/save",
        vertices
      );

      // Check if request was successful
      if (response.status !== 200) {
        throw new Error("Failed to save map.");
      }

      // If successful, set snackbar success message
      setSnackbarSeverity("success");
      setSnackbarMessage("Map created successfully");
      setSnackbarOpen(true);

      // Invalidate "maps" query
      queryClient.invalidateQueries("maps");

      // Reset the state
      setVertices([]);
      resetForm();
    } catch (error) {
      console.error("Error saving map:", error);

      setSnackbarSeverity("error");
      setSnackbarMessage("Failed to save map");
      setSnackbarOpen(true);
    }
  };

  return (
    <div>
      <Typography variant="h5" gutterBottom sx={{ marginBottom: "20px" }}>
        Add new map
      </Typography>

      {/* Form for adding edges */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2} alignItems="center">
          <Grid item sx={{ height: "100px" }}>
            <TextField
              label="Vertex ID"
              variant="outlined"
              size="small"
              {...register("vertexId", { required: "Vertex ID is required" })}
              error={!!errors.vertexId}
            />
            {errors.vertexId && (
              <FormHelperText error>{errors.vertexId.message}</FormHelperText>
            )}
          </Grid>
          <Grid item sx={{ height: "100px" }}>
            <TextField
              label="Connected Vertex ID"
              variant="outlined"
              size="small"
              {...register("connectedVertexId", {
                required: "Connected Vertex ID is required",
              })}
              error={!!errors.connectedVertexId}
            />
            {errors.connectedVertexId && (
              <FormHelperText error>
                {errors.connectedVertexId.message}
              </FormHelperText>
            )}
          </Grid>
          <Grid item sx={{ height: "100px" }}>
            <FormControl variant="outlined" size="small" fullWidth>
              <InputLabel>Select Direction</InputLabel>
              <Select
                {...register("direction", {
                  required: "Direction is required",
                })}
                label="Select Direction"
                sx={{ minWidth: "160px" }}
                error={!!errors.direction}
              >
                <MenuItem value="north">North</MenuItem>
                <MenuItem value="south">South</MenuItem>
                <MenuItem value="east">East</MenuItem>
                <MenuItem value="west">West</MenuItem>
              </Select>
              {errors.direction && (
                <FormHelperText error>
                  {errors.direction.message}
                </FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid item sx={{ height: "100px" }}>
            <Button type="submit" variant="contained" color="primary">
              Add Edge
            </Button>
          </Grid>
        </Grid>
      </form>

      {/* Save Button */}
      <Grid container spacing={2}>
        <Grid item>
          <Button variant="contained" color="primary" onClick={handleSaveMap}>
            Save Map
          </Button>
        </Grid>

        <Grid item>
          <Button variant="contained" color="primary" onClick={handleSaveMap}>
            Reset Map
          </Button>
        </Grid>
      </Grid>

      {/* Display current vertices and edges */}
      {vertices.length > 0 && (
        <div>
          <Typography variant="h6" sx={{ marginTop: "20px" }}>
            Current Vertices and Edges:
          </Typography>
          <ul>
            {vertices.map((vertex) => (
              <li key={vertex.id}>
                {`Vertex ${vertex.id}`}
                <ul>
                  {vertex.edges.map((edge, index) => (
                    <li
                      key={index}
                    >{`${edge.vertex} connected from ${edge.direction}`}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      <CustomSnackbar
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        severity={snackbarSeverity}
      />
    </div>
  );
};

export default AddMap;
