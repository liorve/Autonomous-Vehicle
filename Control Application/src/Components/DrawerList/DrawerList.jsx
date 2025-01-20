import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MapIcon from "@mui/icons-material/Map";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import { useNavigate, useLocation } from "react-router-dom";
import { Tooltip } from "@mui/material";

const menuItems = [
  {
    text: "Control Panel",
    icon: <DashboardIcon />,
    path: "/control-panel",
    tooltip: "This page allows you to initiate a new vehicle delivery.",
  },
  {
    text: "Trips",
    icon: <DirectionsCarIcon />,
    path: "/trips",
    tooltip: "This page allows you to manage and view vehicle trips.",
  },
  {
    text: "Orders",
    icon: <ReceiptLongIcon />,
    path: "/orders",
    tooltip:
      "This page lets you create new orders, view all existing orders, and initiate new deliveries.",
  },
  {
    text: "Manage Maps",
    icon: <MapIcon />,
    path: "/manage-maps",
    tooltip: "This page allows you to create new maps",
  },
  { text: "Statistics", icon: <BarChartIcon />, path: "/statistics" },
  { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
];

function CustomList() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const renderListItem = ({ text, icon, path, tooltip }) => (
    <Tooltip key={path} arrow placement="right" title={tooltip || ""}>
      <ListItem disablePadding>
        <ListItemButton
          onClick={() => navigate(path)}
          sx={{
            backgroundColor: currentPath === path ? "lightgray" : "white",
            "&:hover": {
              backgroundColor:
                currentPath === path ? "lightgray" : "whitesmoke",
            },
          }}
        >
          <ListItemIcon>{icon}</ListItemIcon>
          <ListItemText primary={text} />
        </ListItemButton>
      </ListItem>
    </Tooltip>
  );

  return <List>{menuItems.map(renderListItem)}</List>;
}

export default CustomList;
