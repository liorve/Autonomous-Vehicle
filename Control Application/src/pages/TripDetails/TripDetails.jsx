import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Grid,
  Typography,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
} from "@mui/material";
import io from "socket.io-client";
import TimelineComponent from "../../Components/TimelineComponent/TimelineComponent";
import StatsDisplay from "../../Components/StatsDisplay/RealTimeStatsDisplay";

const socket = io("http://localhost:5000");

const TripDetails = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [tripData, setTripData] = useState(null);
  const [checkpointsData, setCheckpointsData] = useState([]);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [redirectId, setRedirectId] = useState(null);
  const [countdown, setCountdown] = useState(3); // Countdown timer in seconds

  useEffect(() => {
    const fetchTripData = async () => {
      try {
        const tripResponse = await axios.get(
          `http://localhost:5000/api/trips/${tripId}`
        );
        setTripData(tripResponse.data);
      } catch (err) {
        setError("Error fetching trip data.");
      }
    };

    const fetchCheckpointsData = async () => {
      try {
        const checkpointsResponse = await axios.get(
          `http://localhost:5000/api/vehicle_checkpoints/${tripId}`
        );
        setCheckpointsData(checkpointsResponse.data);
      } catch (err) {
        setError("Error fetching checkpoints data.");
      }
    };

    fetchTripData();
    fetchCheckpointsData();

    const handleInsertedId = (data) => {
      console.log("Inserted ID received:", data.id);
      setRedirectId(data.id);
      setDialogOpen(true);

      // Start countdown
      let seconds = 3;
      setCountdown(seconds);
      const intervalId = setInterval(() => {
        setCountdown((prevCountdown) => {
          if (prevCountdown <= 1) {
            clearInterval(intervalId);
            setDialogOpen(false); // Close the dialog before navigating
            navigate(`/trips/${data.id}`);
            return 0;
          }
          return prevCountdown - 1;
        });
      }, 1000);
    };

    // Listen for events from the server
    socket.on("checkpoint_data", (newCheckpoint) => {
      console.log("New checkpoint received:", newCheckpoint);

      if (newCheckpoint.trip_id !== tripId) return;

      setCheckpointsData((prevCheckpoints) => [
        ...prevCheckpoints,
        newCheckpoint,
      ]);
    });

    socket.on("inserted_id", handleInsertedId);

    return () => {
      socket.off("checkpoint_data");
      socket.off("inserted_id");
    };
  }, [tripId, navigate]);

  const handleRedirectNow = () => {
    if (redirectId) {
      navigate(`/trips/${redirectId}`);
      setDialogOpen(false); // Close the dialog immediately
    }
  };

  function mapPathToCreatedAt(tripData, checkpointsData) {
    if (!tripData || !checkpointsData) {
      return [];
    }

    const checkpointsDict = checkpointsData.reduce((acc, checkpoint) => {
      acc[checkpoint.checkpoint_id] = checkpoint.created_at;
      return acc;
    }, {});

    return tripData.path.map((checkpointId) => ({
      checkpoint_id: checkpointId,
      created_at: checkpointsDict[checkpointId] || "",
    }));
  }

  const timelineData = mapPathToCreatedAt(tripData, checkpointsData);

  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TimelineComponent timelineData={timelineData} />
        </Grid>

        <Grid item xs={12}>
          <Card
            variant="outlined"
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "400px",
            }}
          >
            <img
              src="http://localhost:5001/stream_frames"
              alt="Video Stream"
              style={{ width: "100%", maxWidth: "600px" }}
            />
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                Real Time Statistics
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Here you can watch real-time statistics about the vehicle’s
                performance and track its stability from one checkpoint to the
                next.
              </Typography>
              <StatsDisplay checkpointsData={checkpointsData} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Reroute Notification"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">A reroute has been initiated.</Typography>
          <Typography>
            You will be redirected to this trip's details page in {countdown}{" "}
            seconds.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Redirecting to trip ID: {redirectId}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRedirectNow} color="primary">
            Redirect Now
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TripDetails;
