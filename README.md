statemachines
=============
A visual representation and interactive simulation for State Machines, as covered in MIT's 6.01 (Intro to EECS) course, otherwise known as LTI (linear time-invariant) systems.  

Features (Video demos coming soon)
============================
Editing
-------
Create components by clicking on their respective buttons; drag to position, drag and drop from solid gray source endpoint to empty blue target endpoint to connect.  
CHROME ONLY: Create components by dragging in from their respective buttons.  
Right click to reverse a component's orientation.  
Dispose components by dragging to the trash or by "Clear"ing the entire machine.
Running
-------
Toggle between Unit Sample (value 1 at time 0, value 0 otherwise) and Unit Step (value 1 at time 0 and onward) inputs.  
"Start" to run the machine continuously, "Step" to increment 1 time step, "See 1st 10" to display the first 10 time steps.  
Current time, input, and output values will be displayed in a table as well as a line graph.  
Current value of each component will also be displayed.
Saving
------
Saves the current machine as a list of HTML div elements with appropriate attributes for position and definition.  
The saved HTML can be re-loaded through the applet or inserted into the embedding code for default loading.
Back-end
========
The applet uses Bootstrap for layout, jsPlumb for draggable editing, and Highcharts for graphing.  
Primary setup in mvc.js is done mostly through a Model-View-Controller mechanism.  
All visual elements except for the navigation bar are dynamically appended through Javascript.  
The State Machine back-end module is saved in definitions.js, along with several layout definitions for jsPlumb.  
Saving and loading functions are saved in saving.js.  
Images, and code for Bootstrap and jsPlumb, are currently hosted on my Athena locker - web.mit.edu/lu16j/www
Usage
=====
http://web.mit.edu/6.mitx/www/6.01-statemachine/mvc.html  
The website is designed for student interaction. Instructors are encouraged to send skeleton .txt files for students to load and interact with, or to embed the applet with a preloaded machine in a class webpage.  
Embedding code is provided on the website, under "Embedding" in the "About" popup.
