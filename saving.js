/*
*   Save the current state machine
*/
function saveSM() {
    //initialize the string
    var htmlString = '';
    
    //Saves each component as a div class smComp with data attributes type, id, top, left, value, rev (reversed)
    var components = $('.item');
    for(var i=0; i<components.length; i++) {
        var component = components.eq(i);
        if(component[0].id !== 'input' & component[0].id !== 'output') {
            var newString = '<div class="smComp" data-type="'+
                component.attr('data-type')+'" data-id="'+
                component[0].id+'" data-top="'+
                (component.position().top-$('.displayArea').position().top)+'" data-left="'+
                ((component.position().left-$('.displayArea').position().left)/$('.displayArea').width())+'" data-value="'+
                component.find('input').val()+'" data-rev="'+
                component.attr('data-rev')+'"></div>\n';
            htmlString += newString;
        }
    }
    
    //Saves each connection as a div class smConn with data attributes from and to
    var connections = jsPlumb.getAllConnections()['blue rectangle'];
    for(c in connections) {
        var connection = connections[c];
        var newString = '<div class="smConn" data-from="'+
            connection.sourceId+'" data-to="'+
            connection.targetId+'"></div>\n';
        htmlString += newString;
    }
    
    //Initializes the file to be written to, in the form SM-name.txt
    var textToWrite = htmlString;
	var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});
	var fileNameToSaveAs = 'SM-'+document.getElementById("fileToSaveAs").value+'.txt';

    //Generates download link for file
	var downloadLink = document.createElement("a");
	downloadLink.download = fileNameToSaveAs;
	downloadLink.innerHTML = "Download File";
	if (window.webkitURL != null)
	{
		// Chrome allows the link to be clicked programmatically.
		downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
		downloadLink.click();
	}
	else
	{
		// Firefox requires the user to actually click the link.
		downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
		downloadLink.onclick = destroyClickedElement;
		document.body.appendChild(downloadLink);
	}
}

function destroyClickedElement(event)
{
	document.body.removeChild(event.target);
}

//Preloaded demos
var demos = {
    'clear': '',
    '2equiv': '<div class="smComp" data-type="delay" data-id="delay0" data-top="7" data-left="0.307041266025641" data-value="undefined" data-rev="undefined"></div>\
<div class="smComp" data-type="gain" data-id="gain1" data-top="7" data-left="0.16302751068376067" data-value="-1" data-rev="undefined"></div>\
<div class="smComp" data-type="adder" data-id="adder2" data-top="60" data-left="0.36516760149572647" data-value="undefined" data-rev="undefined"></div>\
<div class="smComp" data-type="gain" data-id="gain0" data-top="7" data-left="0.4583333333333333" data-value="-1" data-rev="undefined"></div>\
<div class="smComp" data-type="delay" data-id="delay1" data-top="7" data-left="0.592948717948718" data-value="undefined" data-rev="undefined"></div>\
<div class="smComp" data-type="adder" data-id="adder0" data-top="58" data-left="0.7670940170940171" data-value="undefined" data-rev="undefined"></div>\
<div class="smComp" data-type="delay" data-id="delay2" data-top="180" data-left="0.24252136752136752" data-value="undefined" data-rev="undefined"></div>\
<div class="smComp" data-type="gain" data-id="gain2" data-top="133" data-left="0.40384615384615385" data-value="-2" data-rev="undefined"></div>\
<div class="smComp" data-type="delay" data-id="delay3" data-top="180" data-left="0.5192307692307693" data-value="undefined" data-rev="undefined"></div>\
<div class="smComp" data-type="adder" data-id="adder1" data-top="111" data-left="0.7681623931623932" data-value="undefined" data-rev="undefined"></div>\
<div class="smConn" data-from="gain1" data-to="delay0"></div>\
<div class="smConn" data-from="input" data-to="adder2"></div>\
<div class="smConn" data-from="input" data-to="gain1"></div>\
<div class="smConn" data-from="delay0" data-to="adder2"></div>\
<div class="smConn" data-from="adder2" data-to="adder0"></div>\
<div class="smConn" data-from="adder2" data-to="gain0"></div>\
<div class="smConn" data-from="gain0" data-to="delay1"></div>\
<div class="smConn" data-from="delay1" data-to="adder0"></div>\
<div class="smConn" data-from="input" data-to="adder1"></div>\
<div class="smConn" data-from="input" data-to="delay2"></div>\
<div class="smConn" data-from="delay2" data-to="gain2"></div>\
<div class="smConn" data-from="gain2" data-to="adder1"></div>\
<div class="smConn" data-from="delay2" data-to="delay3"></div>\
<div class="smConn" data-from="delay3" data-to="adder1"></div>',
    '2ordercyclic': '<div class="smComp" data-type="delay" data-id="delay0" data-top="80" data-left="0.4384515224358974" data-value="undefined" data-rev="undefined"></div>\
<div class="smComp" data-type="gain" data-id="gain1" data-top="184" data-left="0.4632411858974359" data-value="-.63" data-rev="yes"></div>\
<div class="smComp" data-type="adder" data-id="adder2" data-top="11" data-left="0.216663327991453" data-value="undefined" data-rev="undefined"></div>\
<div class="smComp" data-type="gain" data-id="gain0" data-top="126" data-left="0.32585470085470086" data-value="1.6" data-rev="yes"></div>\
<div class="smComp" data-type="delay" data-id="delay1" data-top="124" data-left="0.6378205128205128" data-value="undefined" data-rev="undefined"></div>\
<div class="smConn" data-from="input" data-to="adder2"></div>\
<div class="smConn" data-from="adder2" data-to="delay0"></div>\
<div class="smConn" data-from="delay0" data-to="gain0"></div>\
<div class="smConn" data-from="delay0" data-to="delay1"></div>\
<div class="smConn" data-from="delay1" data-to="gain1"></div>\
<div class="smConn" data-from="gain0" data-to="adder2"></div>\
<div class="smConn" data-from="gain1" data-to="adder2"></div>\
<div class="smConn" data-from="adder2" data-to="output"></div>',
    'wallFinder': '<div class="smComp" data-type="delay" data-id="delay0" data-top="64" data-left="0.6905882745726496" data-value="undefined" data-rev="yes"></div>\
<div class="smComp" data-type="gain" data-id="gain1" data-top="130" data-left="0.21537793803418803" data-value="-1" data-rev="yes"></div>\
<div class="smComp" data-type="adder" data-id="adder2" data-top="23" data-left="0.16110777243589744" data-value="undefined" data-rev="undefined"></div>\
<div class="smComp" data-type="gain" data-id="gain0" data-top="23" data-left="0.41452991452991456" data-value="0.1" data-rev="undefined"></div>\
<div class="smComp" data-type="delay" data-id="delay1" data-top="130" data-left="0.43162393162393164" data-value="undefined" data-rev="yes"></div>\
<div class="smComp" data-type="adder" data-id="adder3" data-top="23" data-left="0.5448717948717948" data-value="undefined" data-rev="undefined"></div>\
<div class="smComp" data-type="gain" data-id="gain3" data-top="23" data-left="0.2863247863247863" data-value="0" data-rev="undefined"></div>\
<div class="smConn" data-from="input" data-to="adder2"></div>\
<div class="smConn" data-from="adder2" data-to="gain3"></div>\
<div class="smConn" data-from="gain3" data-to="gain0"></div>\
<div class="smConn" data-from="gain0" data-to="adder3"></div>\
<div class="smConn" data-from="adder3" data-to="delay0"></div>\
<div class="smConn" data-from="delay0" data-to="adder3"></div>\
<div class="smConn" data-from="delay0" data-to="output"></div>\
<div class="smConn" data-from="delay0" data-to="delay1"></div>\
<div class="smConn" data-from="delay1" data-to="gain1"></div>\
<div class="smConn" data-from="gain1" data-to="adder2"></div>'
};

/*
*   Loads file from the file input
*/
function loadSM() {
    var fileToLoad = document.getElementById("fileToLoad").files[0];
    if(fileToLoad.type !== 'text/plain')
        alert('Wrong file type!');
    else {
        var fileReader = new FileReader();
        fileReader.onload = function(fileLoadedEvent) 
        {
            var textFromFileLoaded = fileLoadedEvent.target.result;
            loadHTML(textFromFileLoaded);
        };
        fileReader.readAsText(fileToLoad, "UTF-8");
    }
}
//load preloaded demo
function loadDemo(demo) {
    loadHTML(demos[demo]);
}

//Initializes the machine according to loaded HTML string
function loadHTML(string) {
    $('.statemachine').each(function () {
        //Cleans up the endpoints
        $('.item').each(function () {
            jsPlumb.removeAllEndpoints($(this));
        });
        //Turns off the resize listener
        $(window).off();
        //Turns off jsPlumb listeners
        jsPlumb.unbind();
        //Starts fresh
        $(this).html(string);
        statemachine.setup($(this));
    });
}