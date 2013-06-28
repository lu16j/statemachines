/*
*
*   model for state machine
*
*/
function SM() {
    var exports = {};
    
    //the important mechanisms
    var timeIndex = 0;
    var values = {};
    var functions = {};
    
    //the component definition functions
    function component(name, type, input, K) {
        values[name] = [0];
        if(type === 'delay') {
            values[name].push(0);
            functions[name] = function (i) {
                return values[input][i];
            };
        }
        if(type === 'gain') {
            functions[name] = function (i) {
                return K * values[input][i];
            };
        }
        if(type === 'adder') {
            functions[name] = function (i) {
                var output = 0;
                for(inp in input)
                    output += values[input[inp]][i];
                return output;
            };
        }
        if(type === 'out') {
            functions.out = function (i) {
                return values[input][i];
            };
        }
    }
    
    //Performs 1 time step with input 'inp'
    function step(inp) {
        //Identifies the current index
        var i = values.input.length;
        //Adds 'inp' to the array of inputs at the current time index
        values.input.push(inp);
        //keeps track of components already stepped
        var done = [];
        var next;
        //skips components if not ready to be stepped
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
        timeIndex += 1;
        //Returns the output
        return values.out[i];
    }
    //Steps through an array of inputs, returns array of outputs
    function transduce(inps) {
        var results = [];
        for(i in inps)
            results.push(step(inps[i]));
        return results;
    }
    //initializes machine according to components and connections
    //if previously initialized, can take no arguments
    function initialize(comp, conn) {
        timeIndex = 0;
        values.input = [0];
        var components = jQuery.extend(true, {}, comp);
        var connections = jQuery.extend(true, {}, conn);
        
        for(c in components)
            components[c].splice(1,0,[]);
        
        components.out = ['out',[]];
        //defines parent of each component based on connections
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
        
        for(c in components) {
            var comp = components[c];
            component(c, comp[0], comp[1], comp[2]);
        }
    }
    
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

//TESTING JSPLUMB - lists all connections as pairs of from, to
function listConns() {
    var conns = jsPlumb.getConnections();
    var list = [];
    for(c in conns)
        list.push([conns[c].sourceId, conns[c].targetId]);
    return list;
}

/*
*
*   MODEL
*   functions:  initialize(components list, connections list) - call at beginning to initialize machine
*               step - increments one time step
*               run - continuously steps at 1 second intervals
*               reset - back to time 0
*               switchInput - switches between unit sample and unit step inputs
*
*/
function Model() {
    var sm, chart, interval;
    var exports = {}, sample = true;
    var components, connections;
    
    function initialize(comps, conns) {
        components = comps;
        connections = conns;
        sm = SM();
        sm.initialize(components, connections);
        
        chart = $('.canvas').highcharts({
            title: {text: '', floating: true},
            xAxis: {title: {text: 'Time Step'}, categories: []},
            exporting: {enabled: false},
            legend: {floating: true, verticalAlign: 'top'},
            series: [{name: 'Input', type: 'line', id: 'input', data: [], animation: false},
                    {name: 'Output', type: 'line', id: 'output', data: [], animation: false}]
        });
        
        $('.sample').on('click', switchInput);
        $('.stop').on('click', run);
        $('.step').on('click', step);
        $('.reset').on('click', reset);
        
        updateSpans();
    }
    
    function updateSpans() {
        var spans = $('.componentValue');
        for(s in spans) {
            if(spans[s].id !== undefined)
                spans[s].innerHTML = ('<b>'+spans[s].id+'</b>: '+sm.getCurrentValue(spans[s].id)+',');
        }
    }
    
    //true = unit sample, false = unit step
    function step() {
        var input = 1;
        var time = sm.timeIndex();
        if(sample & time !== 0)
            input = 0;
        var newPoint = sm.step(input);
        var shift = chart.highcharts().get('output').data.length >= 10;
        chart.highcharts().get('input').addPoint(input, true, shift);
        chart.highcharts().get('output').addPoint(newPoint, true, shift);
        $('table').find('tbody').append('<tr><td>'+
                     time+'</td><td>'+
                     input+'</td><td>'+
                     newPoint+'</td></tr>');
        $('.table-container').scrollTop($('.table-container')[0].scrollHeight);
        
        updateSpans();
    }
    
    function reset() {
        sm.initialize(testComponents, testConnections);
        chart.highcharts().get('input').setData([]);
        chart.highcharts().get('output').setData([]);
        $('table').find('tbody').html('');
        
        updateSpans();
    }
    
    function run() {
        if($('.stop').text() === "Start") {
            interval = setInterval(step, 1000);
            $('.stop').text("Stop");
        }
        else {
            clearInterval(interval);
            $('.stop').text("Start");
        }
    }
    
    function switchInput() {
        if($('.sample').text() === "Unit Sample") {
            sample = false;
            $('.sample').text("Unit Step");
        }
        else {
            sample = true;
            $('.sample').text("Unit Sample");
        }
    }
    
    exports.initialize = initialize;
    exports.switchInput = switchInput;
    exports.step = step;
    exports.run = run;
    exports.reset = reset;
    
    return exports;
}

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

var model = Model();
model.initialize(testComponents, testConnections);
