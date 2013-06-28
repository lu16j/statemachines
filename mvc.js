var statemachine = (function () {
    /*
    
    AN EVENT HANDLER
    
    */
    function UpdateHandler() {
        var handlers = {};
        
        function on(event, callback) {
            var callbacks = handlers[event];
            if (callbacks === undefined) {
                callbacks = [];
            }
            callbacks.push(callback);
            handlers[event] = callbacks;
        }
        function trigger(event, data) {
            var callbacks = handlers[event];
            if (callbacks !== undefined) {
                for (var i = 0; i < callbacks.length; i += 1)
                    callbacks[i](data);
            }
        }
        
        return {on: on, trigger: trigger};
    }
    /*
    
    THE STATE MACHINE OBJECT
    
    */
    function SM() {
        var exports = {};
        
        var timeIndex = 0;
        var values = {};
        var functions = {};
        
        function component(name, type, input, K) {
            values[name] = [0];
            if(input.length === 0)
                functions[name] = function (i) { return 0; };
            else {
                if(type === 'delay') {
                    functions[name] = function (i) {
                        return values[input][i-1];              //RETURN PREVIOUS VALUE OF INPUT NODE
                    };
                }
                if(type === 'gain') {
                    functions[name] = function (i) {
                        return K * values[input][i];            //RETURN K TIMES VALUE OF INPUT NODE
                    };
                }
                if(type === 'adder') {
                    functions[name] = function (i) {
                        var output = 0;
                        for(inp in input)
                            output += values[input[inp]][i];    //RETURNS SUM OF ALL INPUT NODES
                        return output;
                    };
                }
                if(type === 'output') {
                    functions.output = function (i) {
                        var output = 0;
                        for(inp in input)
                            output += values[input[inp]][i];    //RETURNS SUM OF ALL INPUT NODES
                        return output;
                    };
                }
            }
        }
        
        function step(inp) {
            //  Identifies the current index
            var i = values.input.length;
            
            //  Updates input value array
            values.input.push(inp);
            
            //  Keeps track of finished calculations, skips component if its input not ready
            var done = [];
            var next;
            while(done.length < Object.keys(functions).length) {
                for(f in functions) {
                    if(done.indexOf(f) < 0) {
                        next = functions[f](i);
                        if(next !== undefined & !isNaN(next)) {
                            values[f].push(next);
                            done.push(f);
                        }
                    }
                }
            }
            
            //  Updates time index
            timeIndex += 1;
            
            return values.output[i];
        }
        
        //  ---NEEDS UPDATE---
        function transduce(inps) {
            var results = [];
            for(i in inps)
                results.push(step(inps[i]));
            return results;
        }
        
        //  Initializes machine according to components and connections
        function initialize(comp, conn) {
            timeIndex = 0;
            values.input = [0];
            var components = jQuery.extend(true, {}, comp);
            var connections = jQuery.extend(true, {}, conn);
            
            for(c in components)
                components[c].splice(1,0,[]);
            components.output = ['output',[]];
            
            //  Defines each component's input(s) based on connections
            for(c in connections) {
                var conn = connections[c];
                var parent = conn[0];
                var child = conn[1];
                var type = components[child][0];
                switch (type) {
                    case 'adder':
                        if(components[child][1].indexOf(parent) < 0)
                            components[child][1].push(parent);
                        break
                    case 'output':
                        if(components[child][1].indexOf(parent) < 0)
                            components[child][1].push(parent);
                        break
                    default:
                        components[child][1] = parent;
                }
            }
            
            //  Defines the internal components
            for(c in components) {
                var comp = components[c];
                component(c, comp[0], comp[1], comp[2]);
            }
        }
        
        //  RETURNS THE CURRENT VALUE OF A COMPONENT
        function getCurrentValue(id) {
            return values[id][values[id].length-1];
        }
        
        exports.timeIndex = function () { return timeIndex; };
        exports.step = step;
        exports.transduce = transduce;
        exports.initialize = initialize;
        exports.getCurrentValue = getCurrentValue;
        
        return exports;
    }
    
    function Model() {
        var sm = SM(), interval;
        var exports = {}, sample = true, handler = UpdateHandler();
        //name: [type, input(s)[, K]]
        var components = {};
        //[parent, child]
        var connections = [];
        
        function step() {
            var input = 1;
            var time = sm.timeIndex();
            if(time === 0) {
                sm.initialize(components, connections);
            }
            if(sample & time !== 0)
                input = 0;
            var output = sm.step(input);
            handler.trigger('step', [time, input, output]);
        }
        
        function firstTen() {
            sm.initialize(components, connections);
            var inputs = [1];
            if(sample)
                inputs = inputs.concat([0,0,0,0,0,0,0,0,0]);
            else
                inputs = inputs.concat([1,1,1,1,1,1,1,1,1]);
            handler.trigger('firstTen', [inputs, sm.transduce(inputs)]);
        }
        
        function reset() {
            sm.initialize(components, connections);
            handler.trigger('reset');
        }
        
        function run(btn) {
            if(btn.text() === "Start") {
                interval = setInterval(step, 1000);
                btn.text("Pause");
            }
            else {
                clearInterval(interval);
                btn.text("Start");
            }
        }
        
        function switchInput(btn) {
            if(btn.text() === "Unit Sample") {
                sample = false;
                btn.text("Unit Step");
            }
            else {
                sample = true;
                btn.text("Unit Sample");
            }
        }
        
        /**************************/
        function updateConnections(connection, remove) {
            var conn = [connection.sourceId, connection.targetId];
            
			if (!remove) connections.push(conn);
			else {
				var idx = -1;
				for (var i = 0; i < connections.length; i++) {
					if (!(connections[i] < conn | connections[i] > conn)) {
						idx = i; 
                        break;
					}
				}
				if (idx != -1) {
                    connections.splice(idx, 1);
                }
			}
        }
        function updateComponents(name, component, remove) {
            var comp = component;
            
			if (!remove) components[name] = comp;
			else {
				for (i in components) {
					if (i === name) {
						delete components[name];
                        break;
					}
				}
			}
        }
        /***************************/
        
        exports.switchInput = switchInput;
        exports.step = step;
        exports.run = run;
        exports.reset = reset;
        exports.on = handler.on;
        exports.getValue = sm.getCurrentValue;
        exports.updateConnections = updateConnections;
        exports.updateComponents = updateComponents;
        exports.firstTen = firstTen;
        
        return exports;
    }
    
    function Controller(model) {
        function switchInput() {
            model.switchInput($(this));
        }
        
        function run() {
            model.run($(this));
        }
        
        function step() {
            model.step();
        }
        
        function reset() {
            model.reset();
        }
        
        function firstTen() {
            model.firstTen();
        }
        
        return {switchInput: switchInput, run: run, step: step, firstTen: firstTen, reset: reset};
    }
    
    function View(div, model, controller) {
        var idmaker = 0;
        var usedIds = ['input','output','delay','gain','adder'];
        
        var exampleEndpoint = {
            endpoint:"Rectangle",
            paintStyle:{ width:20, height:20, fillStyle:"#eee"},
            scope:"blue rectangle",
            connectorStyle : {
                lineWidth:2,
                strokeStyle: "#000",
                joinstyle: 'round'
            },
            connector:[ "Flowchart", { stub:[20, 20], gap:10, cornerRadius:5, alwaysRespectStubs:true } ],	
            dropOptions : {
                tolerance:"touch",
                hoverClass:"dropHover",
                activeClass:"dragActive"
            },
            isTarget: true,
            isSource: true
        };
        
        //RESIZE AND REPOSITION THINGS WHEN WINDOW RESIZES
        var prevWinWidth = $(window).width();
        $(window).resize(function () {
            var ratio = $(window).width() / prevWinWidth;
            $('.item').each(function () {
                var previousLeft = parseFloat($(this).css('left'));
                $(this).css({'left':(previousLeft*ratio)});
            });
            jsPlumb.repaintEverything();
            prevWinWidth = $(window).width();
        });
        
        //CREATE A NEW COMPONENT AT A POSITION
        function createComponent(dataType, dataId, top, left, value, reversed) {
            if(value === undefined)
                value = 0;
            if(dataId === undefined)
                dataId = dataType;
            
            var nameId = dataId;
            if(usedIds.indexOf(dataId) > -1) {
                idmaker = 0;
                while(usedIds.indexOf(dataId + idmaker) > -1)
                    idmaker = idmaker + 1;
                nameId = dataId + idmaker;
            }
            usedIds.push(nameId);
            
            var newComponent = $("<div class='item' data-type="+dataType+" id='"+nameId+"'>"+"<img src='"+dataType+".png'>"+
                                 "</div>");
            newComponent.css({"position":"absolute", "top": top,"left": left});
            newComponent.find('img').css({'height':'100%','width':'100%'});
            
            if(dataType === 'gain') {
                var valueBox = $("<input type='text' id='"+nameId+"'></input>");
                valueBox.val(value);
                newComponent.append(valueBox);
                valueBox.on('keyup', function () {
                    model.updateComponents(nameId, [dataType, parseFloat(valueBox.val())]);
                });
                valueBox.css({"position":"relative", "top":"-90%","left":"30%", "height": "80%","width":"40%", "border":"0px", "background":"none"});
            }
            
            var spanId = $("<span class='componentValue' type='text' id="+nameId+">0</span>");
            newComponent.append(spanId);
            spanId.css({"height": "50%","width":"50%", "text-align":"center"});
            
            displayArea.append(newComponent);
            model.updateComponents(nameId, [dataType, value]);
            
            var maxconns = 1;
            if(dataType === 'adder')
                maxconns = 3;
            
            jsPlumb.draggable($("#"+nameId), {containment: $('.container')});
            
            var outputEndpoint = jsPlumb.addEndpoint($('#'+nameId), {anchor: 'Right', isTarget: false, maxConnections: 3}, exampleEndpoint);
            var inputEndpoint = jsPlumb.addEndpoint($('#'+nameId), {anchor: 'Left', isSource: false, maxConnections: maxconns, paintStyle:{width:20, height:20, strokeStyle:"#225588",
					fillStyle:"transparent",
					lineWidth:2}}, exampleEndpoint);
            
            function switchEndpoints() {
                if(inputEndpoint.anchor.x === 0) {
                    inputEndpoint.setAnchor('Right');
                    outputEndpoint.setAnchor('Left');
                    newComponent.attr('data-rev', 'yes');
                }
                else {
                    inputEndpoint.setAnchor('Left');
                    outputEndpoint.setAnchor('Right');
                    newComponent.attr('data-rev', 'no');
                }
                return false;
            }
            
            if(reversed === 'yes') {
                switchEndpoints();
            }
            
            newComponent[0].oncontextmenu = function (e) {
                return switchEndpoints();
            };
            
        }
        
        //DEFINE EVERYTHING
        var displayArea = $("<div class='displayArea view wide'></div>");
        var componentField = $("<div class='componentField view narrow'></div>");
        var trash = $("<div class='trash short narrow'><i class='icon-trash'></i><strong>TRASH</strong></div>");
        var buttonField =  $("<div class='buttonField short wide'></div>");
        var chart = $('<div class="wide view"></div>');
        var table = $('<div class="narrow view"></div>');
        
        var sampleButton = $('<button class="btn btn-info">Unit Sample</button>');
        sampleButton.on('click', controller.switchInput);
        var runButton = $('<button class="btn btn-success">Start</button>');
        runButton.on('click', controller.run);
        var stepButton = $('<button class="btn btn-primary">Step</button>');
        stepButton.on('click', controller.step);
        var tenButton = $('<button class="btn btn-danger">Show 1st 10</button>');
        tenButton.on('click', controller.firstTen);
        var resetButton = $('<button class="btn btn-warning">Reset</button>');
        resetButton.on('click', controller.reset);
        
        var delayBtn = $("<button class='buttonz btn' data-type='delay'><img src='delay.png'></button>");
        var gainBtn  = $("<button class='buttonz btn' data-type='gain'><img src='gain.png'></button>");
        var adderBtn = $("<button class='buttonz btn' data-type='adder'><img src='adder.png'></button>");
        
        componentField.append(delayBtn, gainBtn, adderBtn);
        
        table.append('<table class="table table-striped table-condensed"><thead>\
                    <tr><th>Time</th><th>X</th><th>Y</th></tr>\
                    </thead><tbody></tbody></table>');
        
        buttonField.append(sampleButton, runButton, stepButton, tenButton, resetButton);
        
        /***************************************/
        
//        var prevHTML = div.html();
//        div.html('');
//        div.html(prevHTML);
        var preComps = $('.smComp');
        var preConns = $('.smConn');
        div.html('');
        
        /***************************************/
        
        div.append(componentField, displayArea, trash, buttonField, table, chart);
        
        //////CREATE INPUT OUTPUT BUTTONS
        var inputComponent = $("<div class='item' id='input'><img src='input.png'><span class='componentValue' type='text' id='input'>0</span></div>");
        var outputComponent = $("<div class='item' id='output'><img src='output.png'><span class='componentValue' type='text' id='output'>0</span></div>");
        displayArea.append(inputComponent, outputComponent);
        $('.item').each(function () {
            $(this).find('span').css({"height": "50%","width":"50%", "text-align":"center"});
            $(this).find('img').css({'height':'100%','width':'100%'});
        });
        inputComponent.css({"position":"absolute", "top": 80,"left": displayArea.position().left});
        outputComponent.css({"position":"absolute", "top": 80,"left": ($(window).width()-displayArea.position().left)});
        jsPlumb.addEndpoint($('#input'),  {anchor:'Right', isSource: true, maxConnections:3}, exampleEndpoint);
        jsPlumb.addEndpoint($('#output'),  {anchor:'Left', isTarget: true, maxConnections:1, paintStyle:{width:20, height:20,
                    strokeStyle:"#225588",
					fillStyle:"transparent",
					lineWidth:2}}, exampleEndpoint);
        jsPlumb.draggable($('.item'));
        
        /***************************************/
        
        function loadComponents(preComp, preConn) {
            for(var i=0; i<preComp.length; i++)
                createComponent(preComp.eq(i).attr('data-type'),
                                preComp.eq(i).attr('data-id'),
                                preComp.eq(i).attr('data-top'),
                                preComp.eq(i).attr('data-left'),
                                preComp.eq(i).attr('data-value'),
                                preComp.eq(i).attr('data-rev'));
            
            for(var i=0; i<preConn.length; i++) {
                var fromPoint = jsPlumb.getEndpoints(preConn.eq(i).attr('data-from'))[0];
                var toPoint;
                if(preConn.eq(i).attr('data-to') === 'output')
                    toPoint = jsPlumb.getEndpoints(preConn.eq(i).attr('data-to'))[0];
                else
                    toPoint = jsPlumb.getEndpoints(preConn.eq(i).attr('data-to'))[1];
                model.updateConnections(jsPlumb.connect({source: fromPoint, target: toPoint}));
            }
        }
        
        loadComponents(preComps, preConns);
        
        /***************************************/
        
        chart.highcharts({
            title: {text: '', floating: true},
            xAxis: {title: {text: 'Time Step'}, categories: []},
            exporting: {enabled: false},
            legend: {floating: true, verticalAlign: 'top'},
            series: [{name: 'Input', type: 'line', id: 'input', data: [], animation: false},
                    {name: 'Output', type: 'line', id: 'output', data: [], animation: false}]
        });
        
        //OTHER FUNCTIONS
        
        function buttonClicked(buttonz, button){
            createComponent(buttonz.attr('data-type'), undefined, buttonz.position().top, buttonz.position().left);
        }
        
        $(".buttonz").on("click",function(){
            buttonClicked($(this), this);
        });
        
        $('.trash').droppable({
            over: function(event, ui) {
                if((['input','output']).indexOf(ui.draggable[0].id) < 0) {
                    jsPlumb.removeAllEndpoints(ui.draggable);
                    model.updateComponents(ui.draggable[0].id, [], true);
                    $(ui.draggable).remove();
                }
            }
        });
        
        function updateSpans() {
            $('.componentValue').each(function () {
                this.innerHTML = model.getValue(this.id);
            });
        }
        
        function step(data) {
            var time = data[0];
            var input = data[1];
            var output = data[2];
            var shift = chart.highcharts().get('output').data.length >= 10;
            chart.highcharts().get('input').addPoint(input, true, shift);
            chart.highcharts().get('output').addPoint(output, true, shift);
            table.find('tbody').append('<tr><td>'+time+'</td><td>'+input+
                                       '</td><td>'+output+'</td></tr>');
            table.scrollTop($(table)[0].scrollHeight);
            updateSpans();
        }
        
        function reset() {
            chart.highcharts().get('input').setData([]);
            chart.highcharts().get('output').setData([]);
            table.find('tbody').html('');
            updateSpans();
        }
        
        function firstTen(data) {
            chart.highcharts().get('input').setData(data[0]);
            chart.highcharts().get('output').setData(data[1]);
            table.find('tbody').html('');
            for(var i=0; i<10; i++)
                table.find('tbody').append('<tr><td>'+i+'</td><td>'+data[0][i]+
                                       '</td><td>'+data[1][i]+'</td></tr>');
            table.scrollTop($(table)[0].scrollHeight);
            updateSpans();
        }
        
        model.on('step', step);
        model.on('reset', reset);
        model.on('firstTen', firstTen);
    }
    
    function setup(div) {
        var model = Model();
        var controller = Controller(model);
        var view = View(div, model, controller);
      
        jsPlumb.ready(function() {
            jsPlumb.importDefaults({
                ConnectionOverlays: [[ "Arrow", { location:-10 } ]]
            });
            jsPlumb.bind("connection", function(info, originalEvent) {
                model.updateConnections(info.connection);
            });
            jsPlumb.bind("connectionDetached", function(info, originalEvent) {
                model.updateConnections(info.connection, true);
            });
        });
    }
    
    return {setup: setup};
})();

$(document).ready(function () {
    $('.statemachine').each(function () {
        statemachine.setup($(this));
    });
});