import logging
import sys
import json
from codecarbon import EmissionsTracker
import time
from datetime import datetime

def setup_tracker(project_name="GreenSoftware", duration=None):
    """Setup and return a CodeCarbon emissions tracker"""
    tracker = EmissionsTracker(
        project_name=project_name,
        log_level=logging.INFO,
        output_file="emissions.csv",
        output_dir="./emissions/",
        save_to_file=True,
        measure_power_secs=5
    )
    return tracker


def track_emissions(duration=None, project_name="GreenSoftware"):
    """Track emissions for a specified duration in seconds"""
    tracker = setup_tracker(project_name)
    
    try:
        tracker.start()
        print(f"Started tracking emissions for {project_name}")
        
        if duration:
            time.sleep(float(duration))
            emissions = tracker.stop()
            result = {
                "success": True,
                "emissions": emissions,
                "timestamp": datetime.now().isoformat(),
                "duration": duration,
                "project": project_name
            }
        else:
            # For manual stopping later
            result = {
                "success": True,
                "message": "Tracking started. Call stop_tracking to end.",
                "timestamp": datetime.now().isoformat(),
                "project": project_name
            }
            
        return json.dumps(result)
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
        return json.dumps(error_result)

def stop_tracking():
    """Stop the current tracking session"""
    try:
        # This assumes a global tracker is running
        emissions = tracker.stop()
        result = {
            "success": True,
            "emissions": emissions,
            "timestamp": datetime.now().isoformat()
        }
        return json.dumps(result)
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
        return json.dumps(error_result)

def get_last_emissions():
    """Get the last recorded emissions data"""
    try:
        # Read the last line from the emissions CSV file
        with open("./emissions/emissions.csv", "r") as f:
            lines = f.readlines()
            if len(lines) > 1:  # Header + at least one data row
                last_line = lines[-1].strip()
                columns = lines[0].strip().split(',')
                values = last_line.split(',')
                
                # Create a dictionary of column names and values
                data = dict(zip(columns, values))
                
                result = {
                    "success": True,
                    "data": data,
                    "timestamp": datetime.now().isoformat()
                }
                return json.dumps(result)
            else:
                return json.dumps({
                    "success": False,
                    "error": "No emissions data found",
                    "timestamp": datetime.now().isoformat()
                })
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
        return json.dumps(error_result)

if __name__ == "__main__":
    # This allows the script to be called from Node.js with arguments
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "start":
            project_name = sys.argv[2] if len(sys.argv) > 2 else "GreenSoftware"
            duration = sys.argv[3] if len(sys.argv) > 3 else None
            print(track_emissions(duration, project_name))
            
        elif command == "stop":
            print(stop_tracking())
            
        elif command == "get":
            print(get_last_emissions())
    else:
        print(json.dumps({
            "success": False,
            "error": "No command specified. Use 'start', 'stop', or 'get'",
            "timestamp": datetime.now().isoformat()
        }))