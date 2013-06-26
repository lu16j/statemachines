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
            if(type === 'out') {
                functions.out = function (i) {
                    return values[input][i];                //DEFINES A NODE TO BE THE OUTPUT
                };
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
            
            return values.out[i];
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
            components.out = ['out',[]];
            
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
        var components, connections;
        
        function initialize(comps, conns) {
            components = comps;
            connections = conns;
            sm.initialize(components, connections);
        }
        
        function step() {
            var input = 1;
            var time = sm.timeIndex();
            if(sample & time !== 0)
                input = 0;
            var output = sm.step(input);
            handler.trigger('step', [time, input, output]);
        }
        
        function reset() {
            sm.initialize(components, connections);
            handler.trigger('reset');
        }
        
        function run(btn) {
            if(btn.text() === "Start") {
                interval = setInterval(step, 1000);
                btn.text("Stop");
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
        
        exports.initialize = initialize;
        exports.switchInput = switchInput;
        exports.step = step;
        exports.run = run;
        exports.reset = reset;
        exports.on = handler.on;
        exports.getValue = sm.getCurrentValue;
        
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
        
        function initialize(comps, conns) {
            model.initialize(comps, conns);
        }
        
        return {switchInput: switchInput, run: run, step: step, reset: reset, initialize: initialize};
    }
    
    function View(div, model, controller) {
        var table = $('<div class="table-container view"></div>');
        table.append('<table class="table table-striped table-condensed"><thead>\
                    <tr><th>Time</th><th>X</th><th>Y</th></tr>\
                    </thead><tbody></tbody></table>');
        var chart = $('<div class="canvas view"></div>').highcharts({
            title: {text: '', floating: true},
            xAxis: {title: {text: 'Time Step'}, categories: []},
            exporting: {enabled: false},
            legend: {floating: true, verticalAlign: 'top'},
            series: [{name: 'Input', type: 'line', id: 'input', data: [], animation: false},
                    {name: 'Output', type: 'line', id: 'output', data: [], animation: false}]
        });
        var componentSpans = $("<div><span class='componentValue' id='sub'></span>\
                        <span class='componentValue' id='g2'></span>\
                        <span class='componentValue' id='r1'></span>\
                        <span class='componentValue' id='gn1'></span>\
                        <span class='componentValue' id='r2'></span>\
                        <span class='componentValue' id='g1p5'></span>\
                        <span class='componentValue' id='gn2'></span>\
                        <span class='componentValue' id='add'></span></div>");
        
        function updateSpans() {
            $('.componentValue').each(function () {
                this.innerHTML = ('<b>'+this.id+'</b>: '+model.getValue(this.id)+',');
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
        
        model.on('step', step);
        model.on('reset', reset);
        
        div.append(componentSpans, chart, table);
        updateSpans();
    }
    
    function setup(div) {
        var model = Model();
        var controller = Controller(model);
        
        var sampleButton = $('<button class="btn btn-info">Unit Sample</button>');
        sampleButton.on('click', controller.switchInput);
        var runButton = $('<button class="btn btn-success">Start</button>');
        runButton.on('click', controller.run);
        var stepButton = $('<button class="btn btn-primary">Step</button>');
        stepButton.on('click', controller.step);
        var resetButton = $('<button class="btn btn-warning">Reset</button>');
        resetButton.on('click', controller.reset);
        
        //name: [type, input(s)[, K]]
        var testComponents = {
            sub: ['adder'],
            g2: ['gain', 2],
            r1: ['delay'],
            gn1: ['gain', -1],
            r2: ['delay'],
            g1p5: ['gain', 1.5],
            gn2: ['gain', -2],
            add: ['adder']
        };
        //[parent, child]
        var testConnections = [
            ['input', 'sub'],
            ['sub', 'g2'],
            ['g2', 'r1'],
            ['g2', 'r2'],
            ['r1', 'gn1'],
            ['gn1', 'sub'],
            ['r2', 'g1p5'],
            ['r2', 'gn2'],
            ['g1p5', 'add'],
            ['gn2', 'add'],
            ['add', 'out']
        ];
        
        controller.initialize(testComponents, testConnections);
        
        div.append(sampleButton, ' ', runButton, ' ', stepButton, ' ', resetButton);
        var view = View(div, model, controller);
    }
    
    return {setup: setup};
})();

$(document).ready(function () {
    $('.statemachine').each(function () {
        statemachine.setup($(this));
    });
});