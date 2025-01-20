import React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const CustomSnackbar = ({ open, onClose, message, severity }) => {
  return (
    <Snackbar open={open} autoHideDuration={5000} onClose={onClose}>
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{
          width: "100%",
          backgroundColor: severity === "success" ? "#69db7c" : "#c92a2a",
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default CustomSnackbar;
