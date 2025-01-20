import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ControlPanel from "./pages/ControlPanel/ControlPanel.jsx";
import ManageMaps from "./pages/ManageMaps/ManageMaps.jsx";
import Statistics from "./pages/Statistics/Statistics.jsx";
import Settings from "./pages/Settings/Settings.jsx";
import Orders from "./pages/Orders/Orders.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import Trips from "./pages/Trips/Trips.jsx";
import TripDetails from "./pages/TripDetails/TripDetails.jsx";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route path="/control-panel" element={<ControlPanel />} />
            <Route path="/manage-maps" element={<ManageMaps />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/trips/:tripId" element={<TripDetails />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
