import React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useNavigate } from "react-router-dom";

const OrdersTable = ({ orders, onDeleteOrder }) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ marginTop: 4 }}>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Contents</TableCell>
              <TableCell>Map ID</TableCell>
              <TableCell>Starting Point</TableCell>
              <TableCell>Destination Point</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(orders) && orders.length > 0 ? (
              orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell>{order._id}</TableCell>
                  <TableCell>{order.contents}</TableCell>
                  <TableCell>{order.map}</TableCell>
                  <TableCell>{order.origin}</TableCell>
                  <TableCell>{order.destination}</TableCell>
                  <TableCell>
                    <Tooltip title="Redirects to control-panel page with pre-selected parameters">
                      <IconButton
                        color="primary"
                        onClick={() =>
                          navigate(
                            `/control-panel?selectedMap=${order.map}&startingPoint=${order.origin}&destinationPoint=${order.destination}&orderID=${order._id}`
                          )
                        }
                      >
                        <PlayArrowIcon />
                      </IconButton>
                    </Tooltip>
                    <IconButton
                      color="secondary"
                      onClick={() => onDeleteOrder(order._id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6}>No orders available</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default OrdersTable;
