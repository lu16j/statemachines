/*

THE STATE MACHINE OBJECT

*/
function SM() {
    var exports = {};
    
    var timeIndex = 0;
    var values = {};
    var functions = {};
    
    /*
    Goes through component list and initialises 
    all components according to their type.
    */
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
                    return values[input][i];                //RETURNS VALUE OF INPUT NODE
                };
            }
        }
    }
    
    /*
    Computes the outputs of all components for 
    one step
    */
    function step(inp) {
        //  Identifies the current index
        var i = values.input.length;
        
        //  Updates input value array
        values.input.push(inp);
        
        //  Keeps track of finished calculations, skips component if its input not ready
        var done = [];
        var next;
        var updated = true;
        while(done.length < Object.keys(functions).length & updated === true) {
            updated = false;
            for(f in functions) {
                if(done.indexOf(f) < 0) {
                    next = functions[f](i);
                    if(next !== undefined & !isNaN(next)) {
                        values[f].push(next);
                        done.push(f);
                        updated = true;
                    }
                }
            }
        }
        //if infinite loop detected
        if(updated === false) {
            alert("You have created an invalid machine, possibly containing a feedback loop with no delay.");
            throw "You have created an invalid machine, possibly containing a feedback loop with no delay.";
        }
        
        //  Updates time index
        timeIndex += 1;
        
        return values.output[i];
    }
    
   /*
   Calls the step function multiple times to
   calculate outputs for a sequence of inputs(inps)
   */
    function transduce(inps) {
        var results = [];
        try {
            for(i in inps)
                results.push(step(inps[i]));
        } catch(e) {
            throw e;
        }
        return results;
    }
    
     /* Initializes machine according to components and
     connections    
     */
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


/*

AN EVENT HANDLER

*/
function UpdateHandler() {
    var handlers = {};
    
    
    /*
    creates a new listener request
    event = event to listen to 
    callback = function to call in the case of the event
    */
    function on(event, callback) {
        var callbacks = handlers[event];
        if (callbacks === undefined) {
            callbacks = [];
        }
        callbacks.push(callback);
        handlers[event] = callbacks;
    }
    
     /*
    calls all functions that are listeners
    event = event that occured
    data = data to pass to the callback functions.
    */
    function trigger(event, data) {
        var callbacks = handlers[event];
        if (callbacks !== undefined) {
            for (var i = 0; i < callbacks.length; i += 1)
                callbacks[i](data);
        }
    }
    
    return {on: on, trigger: trigger};
}

//JSPLUMB DEFINITIONS
 /*
 Defines the various endpoints for out connectors and endpoints.
 Specifies that multiple components can feed into an adder
*/

var genericEndpoint = {
    endpoint:"Rectangle",
    scope:"blue rectangle",
    connectorStyle : {
        lineWidth:2,
        strokeStyle: "#000",
        joinstyle: 'round'
    },
    connector:[ "Flowchart", { stub:20, gap:0, cornerRadius:5, alwaysRespectStubs:true } ],	
    dropOptions : {
        tolerance:"touch",
        hoverClass:"dropHover",
        activeClass:"dragActive"
    }
};
var inputEndpointAttrs = {
    anchor: 'Left',
    paintStyle: {width:15, height:15, strokeStyle:"#225588", fillStyle:"transparent", lineWidth:2},
    isTarget: true,
    isSource: false,
    maxConnections: 1
};

var adderInputAttrs = jQuery.extend(true, {}, inputEndpointAttrs);

// Removes limit for how many components can feed into it
adderInputAttrs.maxConnections = -1;
var outputEndpointAttrs = {
    anchor: 'Right',
    paintStyle: {width:15, height:15, fillStyle:"#eee"},
    isTarget: false,
    isSource: true,
    maxConnections: -1
};