import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Pagination,
} from "@mui/material";

const Trips = () => {
  const [trips, setTrips] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [tripsPerPage] = useState(4);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch trip data from the API
    const fetchTrips = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/trips");

        // Sort trips by created_at in descending order
        const sortedTrips = response.data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        setTrips(sortedTrips);
      } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
      }
    };

    fetchTrips();
  }, []);

  // Calculate the current trips to display based on pagination
  const indexOfLastTrip = currentPage * tripsPerPage;
  const indexOfFirstTrip = indexOfLastTrip - tripsPerPage;
  const currentTrips = trips.slice(indexOfFirstTrip, indexOfLastTrip);

  // Handle page change
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  return (
    <>
      <Grid container spacing={2} style={{ padding: 16 }}>
        {currentTrips.map((trip) => (
          <Grid item xs={12} sm={6} md={6} key={trip._id}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" component="div">
                  Trip ID: {trip._id}
                </Typography>
                <Typography color="textSecondary">
                  Created At:{" "}
                  {new Date(trip.created_at).toLocaleString("en-GB", {
                    timeZone: "UTC",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
                <Typography color="textSecondary">
                  Starting Point: {trip.starting_point}
                </Typography>
                <Typography color="textSecondary">
                  Destination Point: {trip.destination_point}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate(`/trips/${trip._id}`)}
                  style={{ marginTop: 16 }}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Pagination
        count={Math.ceil(trips.length / tripsPerPage)}
        page={currentPage}
        onChange={handlePageChange}
        style={{ display: "flex", justifyContent: "center", marginTop: 16 }}
      />
    </>
  );
};

export default Trips;
