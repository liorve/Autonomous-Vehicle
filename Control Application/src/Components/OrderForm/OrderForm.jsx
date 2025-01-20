import React, { useEffect } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  FormHelperText,
  TextField,
  Tooltip,
} from "@mui/material";
import { Controller } from "react-hook-form";

const OrderForm = ({
  control,
  handleSubmit,
  errors,
  setValue,
  onSubmit,
  maps,
  watch,
}) => {
  const selectedMap = watch("selectedMap");
  const nodes = maps.find((map) => map.id === selectedMap)?.data || [];

  useEffect(() => {
    if (maps && selectedMap) {
      setValue("startingPoint", "");
      setValue("destinationPoint", "");
    }
  }, [selectedMap, maps, setValue]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{ display: "flex", flexDirection: "column", gap: "16px" }}
    >
      <FormControl fullWidth error={!!errors.selectedMap}>
        <InputLabel id="choose-map-label">Choose map</InputLabel>
        <Controller
          name="selectedMap"
          control={control}
          rules={{ required: "Map selection is required" }}
          render={({ field }) => (
            <>
              <Select
                labelId="choose-map-label"
                id="choose-map"
                {...field}
                label="Choose map"
                onChange={(e) => {
                  field.onChange(e);
                  setValue("startingPoint", "");
                  setValue("destinationPoint", "");
                }}
              >
                {maps.map((map, index) => (
                  <MenuItem key={map.id} value={map.id}>
                    Map {index + 1}
                  </MenuItem>
                ))}
              </Select>
              {errors.selectedMap && (
                <FormHelperText>{errors.selectedMap.message}</FormHelperText>
              )}
            </>
          )}
        />
      </FormControl>

      <FormControl fullWidth error={!!errors.startingPoint}>
        <InputLabel id="starting-point-label">Starting point</InputLabel>
        <Controller
          name="startingPoint"
          control={control}
          rules={{ required: "Starting point is required" }}
          render={({ field }) => (
            <>
              <Select
                labelId="starting-point-label"
                id="starting-point"
                {...field}
                label="Starting point"
              >
                {nodes.map((node) => (
                  <MenuItem key={node.id} value={node.id}>
                    Point {node.id}
                  </MenuItem>
                ))}
              </Select>
              {errors.startingPoint && (
                <FormHelperText>{errors.startingPoint.message}</FormHelperText>
              )}
            </>
          )}
        />
      </FormControl>

      <FormControl fullWidth error={!!errors.destinationPoint}>
        <InputLabel id="destination-point-label">Destination point</InputLabel>
        <Controller
          name="destinationPoint"
          control={control}
          rules={{ required: "Destination point is required" }}
          render={({ field }) => (
            <>
              <Select
                labelId="destination-point-label"
                id="destination-point"
                {...field}
                label="Destination point"
              >
                {nodes.map((node) => (
                  <MenuItem key={node.id} value={node.id}>
                    Destination {node.id}
                  </MenuItem>
                ))}
              </Select>
              {errors.destinationPoint && (
                <FormHelperText>
                  {errors.destinationPoint.message}
                </FormHelperText>
              )}
            </>
          )}
        />
      </FormControl>

      <FormControl fullWidth error={!!errors.contents}>
        <Controller
          name="contents"
          control={control}
          rules={{ required: "Contents are required" }}
          render={({ field }) => (
            <>
              <TextField
                {...field}
                label="Contents"
                variant="outlined"
                fullWidth
              />
              {errors.contents && (
                <FormHelperText>{errors.contents.message}</FormHelperText>
              )}
            </>
          )}
        />
      </FormControl>

      <Tooltip
        arrow
        title="Clicking this button will create a new order in the system. Afterward, you can select the start icon in the orders table to be redirected to the control panel with pre-filled input values."
      >
        <Button
          variant="contained"
          color="primary"
          type="submit"
          style={{ alignSelf: "flex-start", minWidth: "300px" }}
        >
          Add new order
        </Button>
      </Tooltip>
    </form>
  );
};

export default OrderForm;
