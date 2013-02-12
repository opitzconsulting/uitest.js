Custom ready sensor
===================

Create a sensor module
----------------------
Create a custom ready sensor by defining a module that follows this template:

     uitest.define('run/feature/yourSensorName', ['run/config', 'run/ready'], function(runConfig, ready) {

        ready.addSensor('yourSensorName', state);
        
        return state;

        function state() {
            return {
                count: 0, // The number of times the sensor was not ready
                ready: true // If the sensor is currently ready
            };
        }
     });

Explanation:

* Module base path `run/feature/`: This is required for uitest to detect
  your sensor automatically as feature.
* `runConfig`: Is the merged configuration of the uitest instance.
* `ready`: Is the internal module that handles waiting.

Use the sensor in your app
--------------------------

Enable the sensor as usual using `<uitest-instance>.feature("yourSensorName")`.

