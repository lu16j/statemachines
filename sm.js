function SM() {
    var exports = {};
    
    //the important mechanisms
    var values = {};
    var functions = {};
    
    //the setup components
    var connections = [];
    var components = {};
    
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
        //Identifies the current time index
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
        values.input = [0];
        if(components !== undefined)
            components = comp;
        if(connections !== undefined)
            connections = conn;
        
        for(c in components) {
            if(components[c][1] !== [])
                components[c].splice(1,0,[]);
        }
        
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
    
    function inout() {
        return [values.input, values.out];
    }
    
    exports.inout = inout;
    exports.step = step;
    exports.transduce = transduce;
    exports.initialize = initialize;
    
    return exports;
};

//TESTING JSPLUMB - lists all connections as pairs of from, to
function listConns() {
    var conns = jsPlumb.getConnections();
    var list = [];
    for(c in conns)
        list.push([conns[c].sourceId, conns[c].targetId]);
    return list;
}

//name: [type, input(s)[, K]]
var components = {
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
var connections = [
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

var sm = SM();
sm.initialize(components, connections);

//should return [0, -1, 2, -4, 8, -16, 32, -64, 128, -256]
var input = [1,0,0,0,0,0,0,0,0,0];
var result = sm.transduce(input);
console.log(result);

/************************
* CHART MAGIC HAPPENS HERE
************************/

var chart = $('.canvas').highcharts({
    title: {text: 'State Machine'},
    xAxis: {title: {text: 'Time Step'}, categories: []},
    exporting: {enabled: false},
    legend: {enabled: false},
    series: [{name: 'Input', type: 'line', id: 'input', data: input, animation: false},
            {name: 'Output', type: 'line', id: 'data', data: result, animation: false}]
});

//TABLES

//var table = $('table').find('tbody');
var inout = sm.inout();
for(i in inout[0]) {
    $('table').find('tbody').append('<tr><td>'+
                 (i-1)+'</td><td>'+
                 inout[0][i]+
                 '</td><td>'+
                 inout[1][i]+
                 '</td></tr>');
}

//STEPS

function step() {
    var newPoint = sm.step(0);
    chart.highcharts().get('input').addPoint(0);
    chart.highcharts().get('data').addPoint(newPoint);
    $('table').find('tbody').append('<tr><td>'+
                 ($('td').length/3-1)+'</td><td>0</td><td>'+
                 newPoint+
                 '</td></tr>');
}

var interval;
$('.stop').on('click', function () {
    if($(this).text() === "Start") {
        interval = setInterval(step, 1000);
        $(this).text("Stop");
    }
    else {
        clearInterval(interval);
        $(this).text("Start");
    }
});
