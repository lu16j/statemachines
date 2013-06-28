////// StateMachine ////
var stateMachine = (function(){
    
    
    //sets up the variant parts of the simulator
    //the two display ares we have

    function View(largeDiv, smallDiv, model, controller){
    }
    
    //connects to all buttons on the simulator
    //and alerts model of changes 
    function Controller(model){
        
        function run(){
        }
     
        return {run:run};
    }
    
    //model stores the current state of the simulator
    //sends changes made to view through event
    //listeners
    function Model(){
      //  var idmaker =0;
        var event_handlers = EventHandler();
        var currentComponent = {};
        var currentSpans ={};
        var connections = [];
        
        function addNewComponent(name, spanId,component){
//            var nameId = name+idmaker;
//            idmaker = idmaker + 1;
           // console.log(nameId);
            
        }
        
        //connection instance and whether connected or removed.
        //to be accessed as conn.sourceId, conn.targetId
        function updateConnections(conn, remove) {
            
			if (!remove) connections.push(conn);
			else {
				var idx = -1;
				for (var i = 0; i < connections.length; i++) {
					if (connections[i] == conn) {
						idx = i; 
                        break;
					}
				}
				if (idx != -1) {
                    connections.splice(idx, 1);
                }
			}
            console.log(connections);
			
        }
        
        return {on: event_handlers.on, addNewComponent:addNewComponent, updateConnections:updateConnections}
    }
    
    
    function EventHandler(){
        
        
        var handlers = {};
        
        function on(event_string, callback){
            var cblist = handlers[event_string];
            if (cblist === undefined){
                cblist =[];
                handlers[event_string] = cblist;
            }
            cblist.push(callback);
        }
        
        function trigger(event_string, data){
         var cblist = handlers[event_string];
            if( cblist !== undefined){
                for(var i=0 ; i<cblist.length;i++){
                    cblist[i](data); 
                }           
            }
        }  
        
        return { on: on, trigger  :trigger};
    }


    function setup(div){
        var idmaker =0;
        var sMbody = div;
        var displayArea = $("<div class='displayArea'></div>");
        var componentField = $("<div class='componentField'></div>");
        var graphDisplay = $("<div class='graphDisplay'></div>");
        var trash = $("<div class='trash'></div>");
        var buttonField =  $("<div class='buttonField'></div>");
        var tableDisplay = $("<div class='tableDisplay'></div>");
        div.append(componentField, displayArea, trash, buttonField,tableDisplay, graphDisplay);
        graphDisplay.highcharts({
            title: {text: '', floating: true},
            xAxis: {title: {text: 'Time Step'}, categories: []},
            exporting: {enabled: false},
            legend: {floating: true, verticalAlign: 'top'},
            series: [{name: 'Input', type: 'line', id: 'input', data: [], animation: false},
                    {name: 'Output', type: 'line', id: 'output', data: [], animation: false}]
        });
        tableDisplay.append('<table class="table table-striped table-condensed"><thead>\
                    <tr><th>Time</th><th>X</th><th>Y</th></tr>\
                    </thead><tbody></tbody></table>');
        
        var sampleButton = $('<button class="btn btn-info">Unit Sample</button>');
//        sampleButton.on('click', controller.switchInput);
        var runButton = $('<button class="btn btn-success">Start</button>');
//        runButton.on('click', controller.run);
        var stepButton = $('<button class="btn btn-primary">Step</button>');
//        stepButton.on('click', controller.step);
        var resetButton = $('<button class="btn btn-warning">Reset</button>');
//        resetButton.on('click', controller.reset);
        
        buttonField.append(sampleButton, runButton, stepButton, resetButton);
        
        $(function(){
            $(".displayArea").droppable();
        });
        
        //buttons
        var delay = $("<button class='buttonz' id='Delay'>Delay</button>");
        var gain  = $("<button class='buttonz' id='Gain'>Gain</button>");
        var adder = $("<button class='buttonz' id='Adder'>Adder</button>");
        var subtractor = $("<button class='buttonz' id='Minus'>Minus</button>");
        var run = $("<button class='buttonz largerButton' id='Run'>Run</button>");
        var remove = $("<button class='buttonz' id='Remove'>Remove</button>");
        var highlight= $("<button class='buttonz' id='Highlight'>Highlight</button>");
               
        
        var model = Model();
        var controller = Controller(model);
        var view= View(displayArea, graphDisplay, model, controller);
        
        componentField.append(delay, gain,adder,subtractor,highlight,remove,run);
        $(".buttonz").on("click",function(){
                buttonClicked($(this), this);
            });
        
        function buttonClicked(buttonz, button){
            var nameId = button.id+idmaker;
            idmaker = idmaker + 1;
            var newComponent = $("<div class='item' id='"+nameId+"'>"+button.id+"<span>"+0+"</span></div>");
//            sMbody.append(newComponent);
            newComponent.css({"position":"absolute", "top": buttonz.position().top,"left":buttonz.position().left});
            var spanId = newComponent.find('span')
            spanId.css({"position":"relative", "top":"-5px","left":"10px"});
            displayArea.append(newComponent);
//           newComponent.draggable();
            model.addNewComponent(button.id, spanId, newComponent);
            
      
            jsPlumb.ready(function() {
                 jsPlumb.importDefaults({
                        DragOptions : { cursor: 'pointer', zIndex:2000 },
                    PaintStyle : { strokeStyle:'#666' },
                    EndpointStyle : { width:20, height:16, strokeStyle:'#666' },
                    Endpoint : "Rectangle",
                    Anchors : ["TopCenter", "TopCenter"]
			});												

			
			jsPlumb.bind("connection", function(info, originalEvent) {
				model.updateConnections(info.connection);
			});
			jsPlumb.bind("connectionDetached", function(info, originalEvent) {
				model.updateConnections(info.connection, true);
			});

		
			var exampleDropOptions = {
				tolerance:"touch",
				hoverClass:"dropHover",
				activeClass:"dragActive"
			};

			var exampleColor = "#00f";
			var exampleEndpoint = {
				endpoint:"Rectangle",
				paintStyle:{ width:25, height:21, fillStyle:exampleColor },
				isSource:true,
				reattach:true,
				scope:"blue rectangle",
				connectorStyle : {
					gradient:{stops:[[0, exampleColor], [0.5, "#09098e"], [1, exampleColor]]},
					lineWidth:5,
					strokeStyle:exampleColor,
					dashstyle:"2 2"
				},
				isTarget:true,
				beforeDrop:function(params) { 
					return confirm("Connect " + params.sourceId + " to " + params.targetId + "?"); 
				},				
				dropOptions : exampleDropOptions
			};			

			var color2 = "#316b31";
			var exampleEndpoint2 = {
				endpoint:["Dot", { radius:15 }],
				paintStyle:{ fillStyle:color2 },
				isSource:true,
				scope:"green dot",
				connectorStyle:{ strokeStyle:color2, lineWidth:8 },
				connector: ["Bezier", { curviness:63 } ],
				maxConnections:3,
				isTarget:true,
				dropOptions : exampleDropOptions
			};
		  jsPlumb.draggable($(".item"));
			var example3Color = "rgba(229,219,61,0.5)";
			var exampleEndpoint3 = {
				endpoint:["Dot", {radius:17} ],
				anchor:"BottomLeft",
				paintStyle:{ fillStyle:example3Color, opacity:0.5 },
				isSource:true,
				scope:'yellow dot',
				connectorStyle:{ strokeStyle:example3Color, lineWidth:4 },
				connector : "Straight",
				isTarget:true,
				dropOptions : exampleDropOptions,
				beforeDetach:function(conn) { 
					return confirm("Detach connection?"); 
				},
				onMaxConnections:function(info) {
					alert("Cannot drop connection " + info.connection.id + " : maxConnections has been reached on Endpoint " + info.endpoint.id);
				}
			};
			var anchors = [[1, 0.2, 1, 0], [0.8, 1, 0, 1], [0, 0.8, -1, 0], [0.2, 0, 0, -1] ],
				maxConnectionsCallback = function(info) {
					alert("Cannot drop connection " + info.connection.id + " : maxConnections has been reached on Endpoint " + info.endpoint.id);
				};


			var e2 = jsPlumb.addEndpoint(nameId, { anchor:[0.5, 1, 0, 1] }, exampleEndpoint2);
			e2.bind("maxConnections", maxConnectionsCallback);
		

			var e3 = jsPlumb.addEndpoint(nameId, { anchor:[0.25, 0, 0, -1] }, exampleEndpoint2);
			e3.bind("maxConnections", maxConnectionsCallback);


            });
          
        }
                     
    
    }
     return {setup:setup};
         

}());

$(document).ready(function(){
    $(".statemachine").each(function(){
        stateMachine.setup($(this))
    })

  
});
