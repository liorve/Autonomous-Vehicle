import errno
import cv2
import urllib.request
import numpy as np
import select
import socket
import urllib.parse
import os
import sys
from flask import Flask, request, jsonify, after_this_request, Response, stream_with_context
import math
import requests
import pyttsx3
from datetime import datetime, timedelta
import multiprocessing
import threading
import queue
 
 
frame_queue = queue.Queue()
 
def generate_frames():
    while True:
        try:
            frame = frame_queue.get(timeout=1)
            _, frame_encoded = cv2.imencode('.jpg', frame)
            frame_bytes = frame_encoded.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n\r\n')
        except queue.Empty:
            continue
 
def speak(text):
    process = multiprocessing.Process(target=_speak_process, args=(text,))
    process.start()
 
    # Wait for the process to complete or timeout after 15 seconds
    process.join(timeout=15)
    if process.is_alive():
        process.terminate()  # Terminate the process if it's still running
 
def _speak_process(text):
    engine = pyttsx3.init()
    engine.say(text)
    engine.runAndWait()
 
vehicle_module = Flask(__name__)
is_busy = False
kernel = np.ones((5, 5), np.uint8)
stream_url = 'http://192.168.2.101:81/stream'
bottom_percentage = 60 / 100
esp32_ip = '192.168.2.101'
esp32_port = '80'  
orientation = "north"  
no_data_received_counter = 100  
URL_FOR_NEW_ROUTES = "http://localhost:5000/api/reroute"
URL_FOR_CHECKPOINT_UPDATES = "http://localhost:5000/api/vehicle_checkpoints"
FRAMES_BEFORE_SAME_TURN = 5
COUNTER_FOR_CRUISE_MODE = 10
COUNTER_FOR_HEAVY_LEFT = 10
COUNTER_FOR_HEAVY_RIGHT = 10

# Define constants for command names
GO = "go"
CRUISE_GO = "cgo"
LEFT = "left"
HEAVY_LEFT = "hleft"
RIGHT = "right"
HEAVY_RIGHT = "hright"
STOP = "stop"
BACK = "back"
TURN_LEFT = "turnLeft"
TURN_RIGHT = "turnRight"
CROSS = "cross"
TURN_AROUND = "turnAround"
Left_back = "leftBack"
Right_back = "rightBack"
TURN_LEFT_back = "TurnLeftBack"
TURN_RIGHT_back = "TurnRightBack"
CROSS_back = "crossBack"
 
def update_value(x):
    pass
 
current_fps = 30  # Default FPS
 
def set_fps(fps):
    global current_fps, stream_url
    current_fps = fps
    stream_url = f'http://{esp32_ip}:81/stream?fps={current_fps}'
    print(f"Setting FPS to {current_fps} and stream URL to {stream_url}")
 
 
def setup_non_blocking_stream(url):
    parsed_url = urllib.parse.urlparse(url)
    host = parsed_url.hostname
    port = parsed_url.port or 80
    path = parsed_url.path or '/'
 
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.setblocking(0)
        result = sock.connect_ex((host, port))
 
        if result != 0 and result != errno.EINPROGRESS and result != errno.WSAEWOULDBLOCK:
            raise socket.error(f"Connection failed with error code {result}")
 
        # Wait until the socket is writable
        while True:
            _, writable, _ = select.select([], [sock], [], 1)
            if writable:
                break
 
        request = f"GET {path} HTTP/1.1\r\nHost: {host}\r\n\r\n"
        sock.send(request.encode('utf-8'))
 
        return sock
    except socket.error as e:
        print(f"Failed to set up non-blocking stream: {e}")
        return None
 
def get_latest_frame_bytes(sock, buffer, chunk_size=65536):
    global no_data_received_counter
    latest_frame = None
 
    while True:
        ready = select.select([sock], [], [], 0.1)[0]
        if ready:
            try:
                new_bytes = sock.recv(chunk_size)
                if new_bytes:
                    buffer += new_bytes
                    no_data_received_counter = 50
                else:
                    print("Connection possibly closed by the server decrementing the restart counter...")
                    no_data_received_counter -= 1
            except socket.error as e:
                print(f"Socket error: {e}")
                break
 
        if no_data_received_counter == 0:
            # Restart the entire program
            print("Restarting the program... no new data received for a long time")
            os.execv(sys.executable, ['python'] + sys.argv)
 
        while True:
            start_marker = buffer.rfind(b'\xff\xd8')  # JPEG start of image
            end_marker = buffer.rfind(b'\xff\xd9')    # JPEG end of image
 
            # Continue searching for a valid start marker if the end marker is found before the start marker
            while start_marker != -1 and end_marker != -1 and start_marker > end_marker:
                # Search for the next start marker before the current start_marker position
                start_marker = buffer.rfind(b'\xff\xd8', 0, start_marker)
 
 
            if start_marker != -1 and end_marker != -1 and start_marker < end_marker:
                 # Extract the complete frame
                latest_frame = buffer[start_marker:end_marker + 2]
                # Keep the remaining buffer after the frame
                buffer = buffer[end_marker + 2:]
            else:
                break
 
        return latest_frame, buffer
 
def get_frame_from_bytes(jpg):
    if jpg:
        return cv2.imdecode(np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_COLOR)
    return None
 
def get_trackbar_values():
    threshold_value = cv2.getTrackbarPos('Threshold', 'settings')
    contrast_factor = cv2.getTrackbarPos('Contrast', 'settings') / 10
    contrast_radius = cv2.getTrackbarPos('Cont_rad', 'settings') / 100
    return threshold_value, contrast_factor, contrast_radius
 
def process_frame(frame):
    frame_height = frame.shape[0]
    start_height = int((1 - bottom_percentage) * frame_height)
    bottom_frame = frame[start_height:, :]
    return bottom_frame
 
def draw_markers(frame, gray):
    global orientation
    aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
    parameters = cv2.aruco.DetectorParameters()
    corners, ids, rejectedImgPoints = cv2.aruco.detectMarkers(gray, aruco_dict, parameters=parameters)
    if len(corners) > 0:
        frame = cv2.aruco.drawDetectedMarkers(frame, corners, ids)
        camera_matrix = np.array([[600, 0, 320],  # fx, cx
                                [0, 600, 240],  # fy, cy
                                [0, 0, 1]])
        dist_coeffs = np.zeros((5, 1))  # Assuming no distortion
 
        # Marker side length (in meters)
        marker_length = 0.04  
 
        # Estimate pose of each marker
        rvecs, tvecs, _ = cv2.aruco.estimatePoseSingleMarkers(corners, marker_length, camera_matrix, dist_coeffs)
 
        # Process the first marker only
        if len(rvecs) > 0:
            rvec = rvecs[0]
            tvec = tvecs[0]
            # Convert rotation vector to Euler angles
            yaw = rotation_vector_to_euler_angles(rvec)
 
            # Determine viewing direction based on yaw
            if -45 < math.degrees(yaw) < 45:
                orientation = "north"
            elif 45 <= math.degrees(yaw) < 135:
                orientation = "west"
            elif -135 < math.degrees(yaw) <= -45:
                orientation = "east"
            else:
                orientation = "south"
 
            print(f"Viewing Direction: {orientation}")
 
    return frame, ids, orientation
 
def adjust_contrast(gray, contrast_factor, contrast_radius):
    height, width = gray.shape
    center_x, center_y = width // 2, height // 2
    outer_radius = min(center_x, center_y) * contrast_radius
    mask = np.ones((height, width), dtype=np.uint8) * 255
    cv2.circle(mask, (center_x, center_y), int(outer_radius), 0, -1)
    outside_region = cv2.bitwise_and(gray, gray, mask=mask)
    adjusted_region = cv2.convertScaleAbs(outside_region, alpha=contrast_factor, beta=0)
    gray = cv2.add(cv2.bitwise_and(gray, gray, mask=cv2.bitwise_not(mask)), adjusted_region)
    return gray
 
def get_binary_image(gray, threshold_value):
    _, binary_thresh = cv2.threshold(gray, threshold_value, 255, cv2.THRESH_BINARY)
    binary_thresh = cv2.bitwise_not(binary_thresh)
    binary_thresh = cv2.morphologyEx(binary_thresh, cv2.MORPH_OPEN, kernel, iterations=2)
    return binary_thresh
 
def find_and_draw_contours(frame, binary_thresh,orientation, marker_detected):
    contours, hierarchy = cv2.findContours(binary_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    frame_center_x = frame.shape[1] // 2  # Calculate the center of the frame
    frame_center_y = frame.shape[0] // 2 # Calculate the center of the frame
    horizontal_offset = 0
    foundContours = False
    if contours:
        foundContours = True
        largest_contour = max(contours, key=cv2.contourArea)
        M = cv2.moments(largest_contour)
        if M['m00'] != 0:
            cx = int(M['m10'] / M['m00'])
            cy = int(M['m01'] / M['m00'])
            area = cv2.contourArea(largest_contour)
            horizontal_offset = cx - frame_center_x
            area_text = f"Area: {area:.2f}"
            cv2.putText(frame, area_text, (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            offset_text = f"Offset: {horizontal_offset}"
            cv2.putText(frame, offset_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.drawContours(frame, [largest_contour], -1, (0, 255, 0), 2)
            cv2.circle(frame, (cx, cy), 5, (0, 0, 255), -1)
 
    if marker_detected:
        # Draw compass-like lines in the upper right corner
        compass_length = 30  # Length of the compass lines
        compass_center_x = frame.shape[1] - 50  # X coordinate for the compass center
        compass_center_y = 50  # Y coordinate for the compass center
 
        # Define the direction order based on the received orientation being "north"
        direction_map = {
                "north": ["north", "east", "south", "west"],
                "east": ["east", "south", "west", "north"],
                "south": ["south", "west", "north", "east"],
                "west": ["west", "north", "east", "south"]
            }
 
        adjusted_directions = direction_map[orientation.lower()]
        compass_points = {
                "north": (0, -compass_length),          # Up
                "east": (compass_length, 0),            # Right
                "south": (0, compass_length),           # Down
                "west": (-compass_length, 0)            # Left
            }
 
            # Draw the compass with the orientation as "north"
        for i, direction in enumerate(adjusted_directions):
            dx, dy = compass_points[list(compass_points.keys())[i]]
            end_point = (compass_center_x + dx, compass_center_y + dy)
            color = (0, 255, 255) if direction == "north" else (255, 0, 0)
            cv2.line(frame, (compass_center_x, compass_center_y), end_point, color, 2)
            cv2.putText(frame, direction[0].upper(), end_point, cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
 
        # Draw marker text just below the compass
        marker_text = f"facing: {orientation.capitalize()}"
        cv2.putText(frame, marker_text, (compass_center_x - 40, compass_center_y + compass_length + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)    
 
    cv2.circle(frame, (frame_center_x, frame_center_y), 5, (255, 0, 0), -1)  # Draw a blue circle at the center
    return frame, horizontal_offset, foundContours
 
def show_frames(binary_thresh, frame):
    cv2.imshow('binary view', binary_thresh)
    cv2.imshow('colored view', frame)
 
# Function to send commands to the ESP32 server
def send_command(command):
    try:
        url = f'http://{esp32_ip}:{esp32_port}/action_handler?action={command}'
        response = urllib.request.urlopen(url)
        response_data = response.read().decode()
        # Check if the response contains the time
        try:
            time_taken = int(response_data)
        except ValueError:
            print(f"Error: {response_data}")
        return command  # Return the command sent
    except urllib.error.URLError as e:
        print(f"Error sending {command} command: {e}")
        return None  # Return None if no command was sent
 
def extract_path_data(json_data):
    # Extracting data from JSON
    directions = json_data['shortest_path']['directions']
    path = json_data['shortest_path']['path']
    mapid = json_data['shortest_path']['mapid']
    orderid = json_data['shortest_path']['orderid']
    orientation = json_data['shortest_path']['orientation']
    trip_id = json_data['trip_id']
 
    # Convert path elements to integers
    path = [int(p) for p in path]
 
    # Create a dictionary where the key is the path number and the value is the direction
    path_from_marker_dict = {path[i]: directions[i] for i in range(len(path)-1)}
 
    # Create a list of lists where each sublist contains a number the time (initially None) and average offset (initially None)
    number_list_with_time = [[num, None, None] for num in path]
 
    print("Dictionary (path number to direction):")
    print(path_from_marker_dict)
 
    print("\nList of all numbers:")
    print(number_list_with_time)
 
    print("\nMap ID:")
    print(mapid)
 
    print("\nOrder ID:")
    print(orderid)
 
    print("\nOrientation:")
    print(orientation)
 
    print("\nTrip ID:")
    print(trip_id)
 
    return path_from_marker_dict, number_list_with_time, mapid, orderid, orientation, trip_id
 
def turn_direction(orientation, direction):
    if orientation == "north":
        if direction == "west":
            return TURN_LEFT
        elif direction == "east":
            return TURN_RIGHT
    elif orientation == "south":
        if direction == "west":
            return TURN_RIGHT
        elif direction == "east":
            return TURN_LEFT
    elif orientation == "east":
        if direction == "north":
            return TURN_LEFT
        elif direction == "south":
            return TURN_RIGHT
    elif orientation == "west":
        if direction == "north":
            return TURN_RIGHT
        elif direction == "south":
            return TURN_LEFT
def opposite_direction(direction):
    if direction == "north":
        return "south"
    elif direction == "south":
        return "north"
    elif direction == "east":
        return "west"
    elif direction == "west":
        return "east"
 
def calculate_direction_acording_to_orientation(orientation, marker_number, path_from_marker_dict):
    if orientation == path_from_marker_dict[marker_number]:
        return CROSS
    elif orientation == opposite_direction(path_from_marker_dict[marker_number]):
        return TURN_AROUND
    else:
        return turn_direction(orientation, path_from_marker_dict[marker_number])
 
# Function to convert rotation vector to Euler angles
def rotation_vector_to_euler_angles(rvec):
    rotation_matrix, _ = cv2.Rodrigues(rvec)
    sy = math.sqrt(rotation_matrix[0, 0] ** 2 + rotation_matrix[1, 0] ** 2)
    singular = sy < 1e-6
 
    if not singular:
        yaw = math.atan2(rotation_matrix[1, 0], rotation_matrix[0, 0])
    else:
        yaw = 0
 
    #return roll, pitch, yaw
    return yaw
 
def send_request_to_server(params, server_endpoint, method):
    # Define the URL and parameters
    url = server_endpoint
    # Send the request based on the specified method
    if method == "GET":
        response = requests.get(url, params=params)
    elif method == "POST":
        response = requests.post(url, json=params)
    elif method == "PUT":
        response = requests.put(url, json=params)
    elif method == "DELETE":
        response = requests.delete(url, params=params)
    else:
        raise ValueError(f"Unsupported HTTP method: {method}")
 
    # Check if the request was successful
    if response.status_code == 200:
        # Parse the JSON response
        data = response.json()
        return data
    else:
        print(f"Request failed with status code {response.status_code}")
        return None
 
def prepare_data_for_server(trip_id, marker_number, mapid, average_offset, number_list, numbers_list_idx, approximation):
    number_list[numbers_list_idx][1] = datetime.now()
    number_list[numbers_list_idx][2] = average_offset
    params = {
                "trip_id": trip_id,
                "checkpoint_id": marker_number,
                "map_id": mapid,
                "average_offset": float(number_list[numbers_list_idx][2]),
                "created_at":str(number_list[numbers_list_idx][1]),
                "approximation": approximation
            }
    return params 
 
def finish_sending_all_requests(trip_id,number_list,mapid):
    minimum_offset = number_list[len(number_list) -1][2]
    smallest_time = number_list[0][1]
    if(smallest_time is None):
        smallest_time = datetime.combine(datetime.today(), datetime.min.time()) #set to 0:00 if we have no first checkpoint start time
        params = prepare_data_for_server(trip_id, int(number_list[0][0]), mapid, 0, number_list, 0, True) #send 0 offset for first checkpoint to show if passed it
        send_request_to_server(params, URL_FOR_CHECKPOINT_UPDATES, "POST") #send first checkpoint if missed
    for i in range(len(number_list)-1):
        if number_list[i+1][2] is not None:
            if number_list[i+1][2] < minimum_offset:
                minimum_offset = number_list[i+1][2]
    counter = 0
    i=1
    found_end_of_gap = False
    gap_list = []
 
    while i < len(number_list):
        counter = 0
        while found_end_of_gap == False and i < len(number_list):
            if number_list[i][1] is None:
                counter+=1
                gap_list.append(i)
                i+=1
            else:
                found_end_of_gap = True
        if counter > 0:
            for j in range(len(gap_list)):
                number_list[gap_list[j]][1] = smallest_time + (timedelta(seconds=(number_list[i][1] - smallest_time).total_seconds() / counter) * (j+1))
                number_list[gap_list[j]][2] = minimum_offset
                params = prepare_data_for_server(trip_id, int(number_list[gap_list[j]][0]), mapid, number_list[gap_list[j]][2], number_list, gap_list[j], True)
                send_request_to_server(params, URL_FOR_CHECKPOINT_UPDATES, "POST")
            gap_list.clear()
            smallest_time = number_list[i][1]
            found_end_of_gap = False
        i+=1
 
def check_if_skipped_checkpoint(marker_number, number_list, numbers_list_idx):
    number = numbers_list_idx
    found = False
    while number < len(number_list) and found == False:
        if number_list[number][0] == marker_number:
            found = True
            return found, number
        number+=1
 
    return found, number
 
def process_frames(sock, bytes):
    global orientation
    global path_data
    global is_busy
    cv2.namedWindow('settings', cv2.WINDOW_AUTOSIZE)
    cv2.createTrackbar('Threshold', 'settings', 80, 255, update_value)
    cv2.createTrackbar('Contrast', 'settings', 19, 20, update_value)
    cv2.createTrackbar('Cont_rad', 'settings', 95, 100, update_value)
    cv2.waitKey(1)
    send_commands = True  # Initialize the flag to True
    previous_marker = [-1]
    consecutive_left = COUNTER_FOR_HEAVY_LEFT   #counter for when its cosidered stuck on left turn- need to perform heavy left turn when 0
    consecutive_right = COUNTER_FOR_HEAVY_LEFT  #counter for when its cosidered stuck on right turn- need to perform heavy right turn when 0
    cruise_mode_counter = COUNTER_FOR_CRUISE_MODE #counter for when to start cruise mode
    path_from_marker_dict, number_list,mapid,orderid,orientation,trip_id = extract_path_data(path_data)
    numbers_list_idx = 0
    average_offset = 0
    frame_number = 0
    frame_for_avg_offset = 0
    frame_on_checkpoint_encounter = 0
    speak("order received - starting delivery")

    while True:
        threshold_value, contrast_factor, contrast_radius = get_trackbar_values()
        jpg, bytes = get_latest_frame_bytes(sock, bytes) # Get the latest frame bytes
        frame = get_frame_from_bytes(jpg) # Get the frame from the bytes
        command_was_sent = False
        if frame is not None:
                frame_number += 1
                frame = process_frame(frame)
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                frame, id_of_marker,orientation = draw_markers(frame, gray)
                gray = adjust_contrast(gray, contrast_factor, contrast_radius)
                binary_thresh = get_binary_image(gray, threshold_value)
                if id_of_marker is not None:
                    marker_detected = True
                else:
                    marker_detected = False
                frame , offset ,foundContour = find_and_draw_contours(frame, binary_thresh, orientation, marker_detected)
                command_sent = None  # Initialize the command sent to None
                if marker_detected:
                    send_command(STOP)
                    if id_of_marker[0][0] != number_list[numbers_list_idx][0] and id_of_marker[0][0] != previous_marker[0]:
                        skipped,number= check_if_skipped_checkpoint(id_of_marker[0][0], number_list, numbers_list_idx)
                        if skipped == True:
                            numbers_list_idx = number
                            print("skipped checkpoint")
                            speak("Skipped checkpoint")
                        else:
                            print("wrong turn - Requesting new route from server...")
                            speak("Wrong turn - Requesting new route from server...")
                            is_busy = False
                            params = {
                                "mapid": mapid,
                                "start": id_of_marker[0][0],
                                "target": number_list[len(number_list) - 1],
                                "orientation": orientation,
                                "orderid": orderid,
                                "reroute": True
                                }
                            path_data = send_request_to_server(params, URL_FOR_NEW_ROUTES, "GET")
                            path_from_marker_dict, number_list, mapid, orderid, orientation, trip_id = extract_path_data(path_data)
                            print("new route received- procceding...")
                            speak("New route received - proceeding...")
                            numbers_list_idx = 0
                            is_busy = True
                            continue
                        
                    if id_of_marker[0][0] == number_list[len(number_list) - 1][0]:
                        command_sent = send_command(STOP)
                        print("finished delivery - awaiting new orders...")
                        #update server when trip is finished
                        params = prepare_data_for_server(trip_id ,int(id_of_marker[0][0]), mapid ,float(average_offset), number_list, numbers_list_idx, False)
                        send_request_to_server(params, URL_FOR_CHECKPOINT_UPDATES, "POST")
                        finish_sending_all_requests(trip_id,number_list,mapid)
                        speak("Finished delivery - awaiting new orders...")
                        break
                    elif id_of_marker[0][0] == number_list[numbers_list_idx][0]:
                        command_sent = calculate_direction_acording_to_orientation(orientation, id_of_marker[0][0], path_from_marker_dict)
                        #update server when checkpoint is reached
                        previous_command = command_sent
                        frame_on_checkpoint_encounter = frame_number
                        params = prepare_data_for_server(trip_id ,int(id_of_marker[0][0]), mapid ,float(average_offset), number_list, numbers_list_idx, False)
                        send_request_to_server(params, URL_FOR_CHECKPOINT_UPDATES, "POST")
                        numbers_list_idx += 1
                    elif id_of_marker[0][0] == previous_marker[0] and (frame_number > (frame_on_checkpoint_encounter + FRAMES_BEFORE_SAME_TURN) or previous_command == CROSS):
                        command_sent = calculate_direction_acording_to_orientation(orientation, id_of_marker[0][0], path_from_marker_dict)
                        frame_on_checkpoint_encounter = frame_number
 
                    if send_commands == True:
                        send_command(command_sent)
                        previous_marker = id_of_marker[0]
 
                    if command_sent is not None:
                        command_was_sent = True
 
                    consecutive_left = COUNTER_FOR_HEAVY_LEFT
                    consecutive_right = COUNTER_FOR_HEAVY_RIGHT
                    cruise_mode_counter = COUNTER_FOR_CRUISE_MODE
                if marker_detected == False or command_was_sent == False:  # if no marker detected or no command was sent
                    frame_for_avg_offset+=1
                    average_offset = average_offset + (abs(offset) - average_offset) / frame_for_avg_offset   # Calculate the running average offset only when no marker is detected
                    if send_commands:  # Only send commands if the flag is True
                        if foundContour == True:
                            if offset < -50:
                                command_sent = send_command(LEFT)
                                consecutive_left -=1
                                consecutive_right = COUNTER_FOR_HEAVY_RIGHT
                                cruise_mode_counter = COUNTER_FOR_CRUISE_MODE
                            elif offset > 50:
                                command_sent = send_command(RIGHT)
                                consecutive_right -=1
                                consecutive_left = COUNTER_FOR_HEAVY_LEFT
                                cruise_mode_counter = COUNTER_FOR_CRUISE_MODE
                            elif cruise_mode_counter > 0:
                                command_sent = send_command(GO)
                                cruise_mode_counter -=1
                                consecutive_left = COUNTER_FOR_HEAVY_LEFT
                                consecutive_right = COUNTER_FOR_HEAVY_LEFT
                            elif cruise_mode_counter == 0:
                                command_sent = send_command(CRUISE_GO)
                                cruise_mode_counter -=1 # drop it below 0 so we wont send cruise_go commands for no reason(one command is enough its a continous command)
                        elif foundContour == False: # If the flag is False, start backtracking
                                command_sent = None
                                send_command(CROSS_back)
                                consecutive_left = COUNTER_FOR_HEAVY_LEFT
                                consecutive_right = COUNTER_FOR_HEAVY_RIGHT
                                cruise_mode_counter = COUNTER_FOR_CRUISE_MODE
 
                    else:  #emergency stop
                        command_sent = send_command(STOP)
                    command_was_sent = True
                if consecutive_left == 0:   # if stuck on left turn perform strong left turn
                    send_command(HEAVY_LEFT)
                    consecutive_left = COUNTER_FOR_HEAVY_LEFT
                elif consecutive_right == 0:  # if stuck on right turn perform strong right turn
                    send_command(HEAVY_RIGHT)
                    consecutive_right = COUNTER_FOR_HEAVY_RIGHT
 
                # Add the frames to the queue
                frame_queue.put(frame)
 
                show_frames(binary_thresh, frame)
                key = cv2.waitKey(1)
                if key == 27:
                    cv2.destroyAllWindows()
                    break
                elif key == ord('d'):  
                    send_commands = not send_commands
 
    cv2.destroyAllWindows()
 
def main():
    global is_busy
    is_busy = True  
    try:
        current_fps = 30  
        set_fps(current_fps)  
        bytes = b''
  
        sock = setup_non_blocking_stream(stream_url)
        try:
            process_frames(sock, bytes)
        finally:
            sock.close()  
    finally:
        is_busy = False  # Reset the server status

@vehicle_module.route('/process_path', methods=['POST'])
def process_path():
    global is_busy, path_data
    if is_busy:
        return jsonify({"error": "Server is busy"}), 503  # Return a 503 Service Unavailable error
 
    if request.is_json:
        data = request.get_json()
        path_data = data
        if "shortest_path" in path_data:
            threading.Thread(target=main).start()
            return jsonify({"status": "Processing started"}), 202
        else:
            return jsonify({"error": "Invalid JSON structure"}), 400
    else:
        return jsonify({"error": "Invalid request format"}), 400
 
@vehicle_module.route('/stream_frames', methods=['GET'])
def stream_frames():
    return Response(stream_with_context(generate_frames()), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    vehicle_module.run(debug=False, threaded=True, port=5001)  # Run the Flask app on port 5001