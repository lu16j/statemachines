var saved = {};
var htmlString;

function saveSM(id) {
    htmlString = '';
    var component;
    var items = $('.item');
    for(var i=0; i<items.length; i++) {
        component = items.eq(i);
        if(component[0].id !== 'input' & component[0].id !== 'output') {
            var newString = '<div class="smComp" data-type="'+
                component.attr('data-type')+'" data-id="'+
                component[0].id+'" data-top="'+
                component.position().top+'" data-left="'+
                component.position().left+'" data-value="'+
                component.find('input').val()+'" data-rev="'+
                component.attr('data-rev')+'"></div>\n';
            htmlString += newString;
        }
    }
    
    var connection;
    var connections = jsPlumb.getAllConnections()['blue rectangle'];
    for(c in connections) {
        connection = connections[c];
        saveConnection(connection.sourceId, connection.targetId);
    }
    saved[id] = htmlString;
    
    console.log('Save the following HTML string for future use:');
    return htmlString;
}

function saveConnection(fromId, toId) {
    var newString = '<div class="smConn" data-from="'+
        fromId+'" data-to="'+
        toId+'"></div>\n';
    htmlString += newString;
}

function loadSM(id) {
    $('.statemachine').each(function () {
        $('.item').each(function () {
            jsPlumb.removeAllEndpoints($(this));
        });
        $(this).html(saved[id]);
        statemachine.setup($(this));
    });
}