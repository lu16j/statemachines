//function SM(s) {
//    this.startState = s;
//};
//SM.prototype.setStartState = function (ss) {
//    this.startState = ss;
//}
//SM.prototype.getStartState = function () {
//    return this.startState;
//}
//SM.prototype.getNextValues = function (s, i) {
//    return [s, i];
//}
//SM.prototype.start = function () {
//    this.state = this.getStartState();
//}
//SM.prototype.step = function (inp) {
//    var so = this.getNextValues(this.state, inp);
//    this.state = so[0];
//    return so[1];
//}
//SM.prototype.transduce = function (inps) {
//    var result = [];
//    this.start();
//    for(i in inps) {
//        result.push(this.step(inps[i]));
//    }
//    return result;
//}
//function R(s) {
//    SM.call(this);
//    this.startState = s;
//}
//R.prototype = Object.create(SM.prototype);
//R.prototype.constructor = R;
//R.prototype.getNextValues = function (s, i) {
//    return [i, s];
//}
//function Gain(s) {
//    SM.call(this);
//    this.startState = s;
//}
//Gain.prototype = Object.create(SM.prototype);
//Gain.prototype.constructor = Gain;
//Gain.prototype.getNextValues = function (s, i) {
//    return [s, s * i];
//}
//function Cascade(m1, m2) {
//    this.m1 = m1;
//    this.m2 = m2;
//    SM.call(this);
//}
//Cascade.prototype = Object.create(SM.prototype);
//Cascade.prototype.constructor = Cascade;
//Cascade.prototype.getStartState = function () {
//    return [this.m1.getStartState(), this.m2.getStartState()];
//}
//Cascade.prototype.getNextValues = function (s, i) {
//    var s1 = s[0], s2 = s[1];
//    var new1 = this.m1.getNextValues(s1, i);
//    var new2 = this.m2.getNextValues(s2, new1[1]);
//    return [[new1[0], new2[0]], new2[1]];
//}

//class FeedbackAdd(SM):
//    def __init__(self, m1, m2):
//        self.m1 = m1
//        self.m2 = m2
//
//    def getStartState(self):
//        # Start state is tuple of start states of the two machines
//        return (self.m1.getStartState(), self.m2.getStartState())
//
//
//    def getNextValues(self, state, inp):
//        (s1, s2) = state
//        # Find the output of m2 by propagating an arbitrary input through
//        # the cascade of m1 and m2
//        (ignore, o1) = self.m1.getNextValues(s1, 99999999)
//        (ignore, o2) = self.m2.getNextValues(s2, o1)
//        # Now get a real new state and output
//        (newS1, output) = self.m1.getNextValues(s1, inp+o2)
//        (newS2, o2) = self.m2.getNextValues(s2, output)
//        return ((newS1, newS2), output)

jsPlumb.ready(function() {
    jsPlumb.importDefaults({
        // default drag options
        DragOptions : { cursor: 'pointer', zIndex:2000 },
        // default to blue at one end and green at the other
        EndpointStyles : [{ fillStyle:'#225588' }, { fillStyle:'#558822' }],
        // blue endpoints 7 px; green endpoints 11.
        Endpoints : [ [ "Dot", {radius:7} ], [ "Dot", { radius:11 } ]],
        // the overlays to decorate each connection with.  note that the label overlay uses a function to generate the label text; in this
        // case it returns the 'labelText' member that we set on each connection in the 'init' method below.
        ConnectionOverlays : [
            [ "Arrow", { location:-10 } ],
            [ "Label", { 
                location:0.1,
                id:"label",
                cssClass:"aLabel"
            }]
        ]
    });
    var connectorPaintStyle = {
        opacity: 0.5,
        lineWidth:4,
        strokeStyle:"#deea18",
        joinstyle:"round",
        outlineColor:"#EAEDEF",
        outlineWidth:2
    },
    // .. and this is the hover style. 
    connectorHoverStyle = {
        lineWidth:4,
        strokeStyle:"#2e2aF8"
    },
    endpointHoverStyle = {fillStyle:"#2e2aF8"};
    jsPlumb.makeSource($('.item'), {
        anchor: 'Continuous',
        endpoint:"Dot",
        paintStyle:{ 
            strokeStyle:"#225588",
            fillStyle:"transparent",
            radius:5,
            lineWidth:2 
        },				
        isSource:true,
        connector:[ "Flowchart", { stub:[5, 5], gap:5, cornerRadius:5, alwaysRespectStubs:true } ],								                
        connectorStyle:connectorPaintStyle,
        hoverPaintStyle:endpointHoverStyle,
        connectorHoverStyle:connectorHoverStyle,
        dragOptions:{}
    });
    jsPlumb.makeTarget($('.item'), {
        anchor: 'Continuous',
        endpoint:"Dot",					
        paintStyle:{ fillStyle:"#558822",radius:5 },
        hoverPaintStyle:endpointHoverStyle,
        maxConnections:-1,
        dropOptions:{ hoverClass:"hover", activeClass:"active" },
        isTarget:true
    });
    
    jsPlumb.bind("jsPlumbConnection", function(connInfo, originalEvent) { 
        var connection = connInfo.connection;
        console.log(connection.sourceId + "-" + connection.targetId);
    });
});