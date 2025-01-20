import React, { useState } from "react";
import { Box } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useForm } from "react-hook-form";
import CustomSnackbar from "../../Components/CustomSnackbar/CustomSnackbar";
import OrderForm from "../../Components/OrderForm/OrderForm";
import OrdersTable from "../../Components/OrdersTable/OrdersTable";

// Fetch maps
const fetchMaps = async () => {
  const { data } = await axios.get("http://localhost:5000/api/maps");
  return data;
};

// Fetch orders
const fetchOrders = async () => {
  const { data } = await axios.get("http://localhost:5000/api/orders");
  return data.orders; 
};

const Orders = () => {
  const queryClient = useQueryClient();

  // Fetch maps
  const {
    data: maps,
    isLoading: isLoadingMaps,
    error: errorMaps,
  } = useQuery({
    queryKey: ["maps"],
    queryFn: fetchMaps,
  });

  // Fetch orders
  const {
    data: orders = [],
    isLoading: isLoadingOrders,
    error: errorOrders,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
    initialData: [], 
  });

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      selectedMap: "",
      startingPoint: "",
      destinationPoint: "",
      contents: "",
    },
    mode: "onTouched",
  });

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const onSubmit = async (data) => {
    const { selectedMap, startingPoint, destinationPoint, contents } = data;

    if (!selectedMap || !startingPoint || !destinationPoint || !contents) {
      setSnackbarSeverity("error");
      setSnackbarMessage("Please fill out all fields.");
      setSnackbarOpen(true);
      return;
    }

    const payload = {
      contents,
      map: selectedMap,
      origin: startingPoint,
      destination: destinationPoint,
    };

    try {
      const response = await axios.post(
        "http://localhost:5000/api/orders/create",
        payload
      );

      console.log(response);

      setSnackbarSeverity("success");
      setSnackbarMessage("Order created successfully!");

      queryClient.invalidateQueries(["orders"]);
    } catch (error) {
      console.log(error);
      setSnackbarSeverity("error");
      setSnackbarMessage("Error creating order.");
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleClose = () => {
    setSnackbarOpen(false);
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await axios.delete(`http://localhost:5000/api/orders/delete/${orderId}`);
      queryClient.invalidateQueries(["orders"]);

      setSnackbarSeverity("success");
      setSnackbarMessage("Order deleted successfully!");
      setSnackbarOpen(true);
    } catch (error) {
      console.log("Error deleting order:", error);
      setSnackbarSeverity("error");
      setSnackbarMessage("Error deleting order.");
      setSnackbarOpen(true);
    }
  };

  if (isLoadingMaps || isLoadingOrders) return <span>Loading...</span>;
  if (errorMaps) return <span>Error fetching maps.</span>;
  if (errorOrders) return <span>Error fetching orders.</span>;

  const sortedOrders = orders
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const sortedMaps = [...maps].sort(
    (a, b) => a.creation_time - b.creation_time
  );

  return (
    <Box sx={{ padding: 2 }}>
      <OrderForm
        control={control}
        handleSubmit={handleSubmit}
        errors={errors}
        setValue={setValue}
        onSubmit={onSubmit}
        maps={sortedMaps}
        watch={watch}
      />

      <CustomSnackbar
        open={snackbarOpen}
        onClose={handleClose}
        message={snackbarMessage}
        severity={snackbarSeverity}
      />

      <OrdersTable orders={sortedOrders} onDeleteOrder={handleDeleteOrder} />
    </Box>
  );
};

export default Orders;
