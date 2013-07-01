var statemachine = (function () {
    
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
        
        function updateConnections(connection) {
            if(connection.sourceId === connection.targetId)
                jsPlumb.detach(connection);
            connections = [];
            var allConnections = jsPlumb.getAllConnections()['blue rectangle'];
            for(c in allConnections)
                    connections.push([allConnections[c].sourceId, allConnections[c].targetId]);
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
        
        //DEFINE EVERYTHING
        var displayArea = $("<div class='displayArea view wide'></div>");
        var componentField = $("<div class='componentField view narrow'></div>");
        var trash = $("<div class='trash short narrow'><i class='icon-trash'></i><strong>TRASH</strong></div>");
        var buttonField =  $("<div class='buttonField short wide'></div>");
        var chart = $('<div class="wide view"></div>');
        var table = $('<div class="narrow view"></div>');
        
        /***************************************/
        //PRELOAD MACHINE (IF ANY)s
        var preComp = $('.smComp');
        var preConn = $('.smConn');
        div.html('');
        
        /***************************************/
        
        div.append(componentField, displayArea, trash, buttonField, table, chart);
        
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
        
        buttonField.append(sampleButton, runButton, resetButton, stepButton, tenButton);
        
        var delayBtn = $("<button class='buttonz btn' data-type='delay' data-toggle='tooltip' title='Delay'>\
                         <img src='http://web.mit.edu/lu16j/www/state/delay.png'></button>");
        var gainBtn  = $("<button class='buttonz btn' data-type='gain' data-toggle='tooltip' title='Gain'>\
                         <img src='http://web.mit.edu/lu16j/www/state/gain.png'></button>");
        var adderBtn = $("<button class='buttonz btn' data-type='adder' data-toggle='tooltip' title='Adder'>\
                         <img src='http://web.mit.edu/lu16j/www/state/adder.png'></button>");
        
        componentField.append(delayBtn, gainBtn, adderBtn);
        
        table.append('<table class="table table-striped table-condensed"><thead>\
                    <tr><th>T</th><th>X</th><th>Y</th></tr>\
                    </thead><tbody></tbody></table>');
        
        chart.highcharts({
            title: {text: '', floating: true},
            xAxis: {title: {text: 'Time Step'}, categories: []},
            legend: {floating: true, verticalAlign: 'top'},
            series: [{name: 'Input', type: 'line', id: 'input', data: [], animation: false},
                    {name: 'Output', type: 'line', id: 'output', data: [], animation: false}]
        });
        
        //CREATE A NEW COMPONENT AT A POSITION
        var usedIds = ['delay','gain','adder'];
        function createComponent(dataType, dataId, top, left, value, reversed) {
            if(value === undefined)
                value = 0;
            if(dataId === undefined)
                dataId = dataType;
            
            var nameId = dataId;
            if(usedIds.indexOf(dataId) > -1) {
                var idmaker = 0;
                while(usedIds.indexOf(dataId + idmaker) > -1)
                    idmaker = idmaker + 1;
                nameId = dataId + idmaker;
            }
            usedIds.push(nameId);
            
            var newComponent = $("<div class='item' data-type="+dataType+" id='"+nameId+"'>"+
                                 "<img src='http://web.mit.edu/lu16j/www/state/"+dataType+".png'>"+
                                 "</div>");
            newComponent.css({"top": top+displayArea.position().top,
                              "left": left*displayArea.width()+displayArea.position().left});
            
            if(dataType === 'gain') {
                var valueBox = $("<input class='gainInput' type='text' id='"+nameId+"'></input>");
                valueBox.val(value);
                newComponent.append(valueBox);
                valueBox.on('keyup', function () {
                    model.updateComponents(nameId, [dataType, parseFloat(valueBox.val())]);
                });
            }
            
            var spanId = $("<span class='componentValue' type='text' id="+nameId+">0</span>");
            newComponent.append(spanId);
            
            displayArea.append(newComponent);
            if(dataType !== 'input' & dataType !== 'output')
                model.updateComponents(nameId, [dataType, value]);
            
            jsPlumb.draggable($("#"+nameId), {containment: $('.container')});
            
            var outputEndpoint, inputEndpoint;
            if(dataType !== 'output')
                outputEndpoint = jsPlumb.addEndpoint($('#'+nameId), outputEndpointAttrs, genericEndpoint);
            if(dataType !== 'input' & dataType !== 'adder')
                inputEndpoint = jsPlumb.addEndpoint($('#'+nameId), inputEndpointAttrs, genericEndpoint);
            if(dataType === 'adder')
                inputEndpoint = jsPlumb.addEndpoint($('#'+nameId), adderInputAttrs, genericEndpoint);
            
            function switchEndpoints() {
                if(inputEndpoint.anchor.x === 0) {
                    inputEndpoint.setAnchor('Right');
                    outputEndpoint.setAnchor('Left');
                    newComponent.attr('data-rev', 'yes');
                    if(dataType === 'gain')
                        newComponent.find('img').attr('src', 'http://web.mit.edu/lu16j/www/state/gain-rev.png');
                }
                else {
                    inputEndpoint.setAnchor('Left');
                    outputEndpoint.setAnchor('Right');
                    newComponent.attr('data-rev', 'no');
                    if(dataType === 'gain')
                        newComponent.find('img').attr('src', 'http://web.mit.edu/lu16j/www/state/gain.png');
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
        
        //////CREATE INPUT OUTPUT BUTTONS
        createComponent('input', 'input', 80, 0);
        createComponent('output', 'output', 80, (displayArea.width()-80)/displayArea.width());
        
        /***************************************/
        //CREATE PRELOADED MACHINE (IF ANY)
        for(var i=0; i<preComp.length; i++)
            createComponent(preComp.eq(i).attr('data-type'),
                            preComp.eq(i).attr('data-id'),
                            parseFloat(preComp.eq(i).attr('data-top')),
                            parseFloat(preComp.eq(i).attr('data-left')),
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
        
        /***************************************/
        
        //OTHER FUNCTIONS
        
        //RESIZE EVERYTHING
        var prevWinWidth = displayArea.width();
        var prevWinLeft = displayArea.position().left;
        $(window).on('resize', function () {
            var ratio = displayArea.width() / prevWinWidth;
            $('.item').each(function () {
                var previousLeft = parseFloat($(this).css('left'))-prevWinLeft;
                $(this).css({'left':(previousLeft*ratio+displayArea.position().left)});
            });
            jsPlumb.repaintEverything();
            prevWinWidth = displayArea.width();
            prevWinLeft = displayArea.position().left;
        });
        
        function buttonClicked(buttonz, button){
            createComponent(buttonz.attr('data-type'), undefined, buttonz.position().top-displayArea.position().top, 0);
        }
        
        $(".buttonz").on("click",function(){
            buttonClicked($(this), this);
        });
        
        $('.trash').droppable({
            over: function(event, ui) {
                if((['input','output']).indexOf(ui.draggable[0].id) < 0) {
                    delete usedIds[usedIds.indexOf(ui.draggable[0].id)];
                    jsPlumb.removeAllEndpoints(ui.draggable);
                    model.updateComponents(ui.draggable[0].id, [], true);
                    $(ui.draggable).remove();
                }
            }
        });
        
        function updateSpans() {
            $('.componentValue').each(function () {
                this.innerHTML = Math.round(model.getValue(this.id)*100000)/100000;
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
        jsPlumb.ready(function() {
            jsPlumb.importDefaults({
                ConnectionOverlays: [[ "Arrow", { location: -10 } ]]
            });
            jsPlumb.bind("connection", function(info) {
                model.updateConnections(info.connection);
            });
            jsPlumb.bind("connectionDetached", function(info) {
                model.updateConnections(info.connection);
            });
        });
        
        var model = Model();
        var controller = Controller(model);
        var view = View(div, model, controller);
    }
    
    return {setup: setup};
})();

$(document).ready(function () {
    $('.statemachine').each(function () {
        statemachine.setup($(this));
    });
});