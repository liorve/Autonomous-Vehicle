import {
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Box,
} from "@mui/material";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";
import TimelineDot from "@mui/lab/TimelineDot";
import { Start as StartIcon, Flag as FlagIcon } from "@mui/icons-material";

const TimelineComponent = ({ timelineData }) => {
  if (timelineData.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        style={{ height: "100vh" }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Trip Checkpoints Timeline
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Here you can watch real-time updates of the vehicle reaching each
          checkpoint. If this trip is from the past, you can also view the times
          at which the vehicle reached each checkpoint.
        </Typography>
        <Timeline position="alternate">
          {timelineData.map((checkpoint, index) => (
            <TimelineItem key={index}>
              <TimelineOppositeContent
                sx={{ m: "auto 0" }}
                align={index === 0 ? "right" : "left"}
                variant="body2"
                color="text.secondary"
              >
                {checkpoint.created_at !== "" ? checkpoint.created_at : ""}
              </TimelineOppositeContent>
              <TimelineSeparator>
                {index !== 0 && <TimelineConnector />}
                <TimelineDot
                  sx={{
                    bgcolor:
                      checkpoint.created_at === ""
                        ? "grey.500"
                        : "primary.main",
                  }}
                >
                  {index === 0 ? (
                    <StartIcon />
                  ) : index === timelineData.length - 1 ? (
                    <FlagIcon />
                  ) : null}
                </TimelineDot>
                {index < timelineData.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent sx={{ py: "12px", px: 2 }}>
                <Typography variant="h6" component="span">
                  Checkpoint {checkpoint.checkpoint_id}
                </Typography>
                <Typography>
                  {index === 0
                    ? "Start of the journey"
                    : index === timelineData.length - 1
                    ? "End of the journey"
                    : "Intermediate checkpoint"}
                </Typography>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  );
};

export default TimelineComponent;
