var c;
var CURRENT_SCALE = 0.5;
$(document).ready(function(){
    var width = $('#canvasView').width();
    c = new fabric.Canvas('c').setWidth(width).setHeight(600); 
	$("#c").droppable
	({
		drop: function (event, ui)
		{
			var imgURL = ui.draggable.attr('data-value');
			console.log("imgURL :"+imgURL );
			fabric.Image.fromURL(imgURL, function(img) {    
			var oImg = img.set({ left: 200, top: 100, angle: 0 }).scale(CURRENT_SCALE);
			console.log("the omg is :"+oImg);
			c.add(oImg).renderAll();
			});  	
		}
	});
	
    $("#e9").select2();
    fetchItems();
}); //end of document.ready

//function should build query string from search input, filter selects, etc. and return a JSON object of query params to be passed to back-end.
function buildQuery() {
    return {};
}

function doLoading() {
    $('#listView').find(".objectEach").remove();
}


function clearLoading() {
    return;
}


function fetchItems() {
    var params = buildQuery();
    doLoading();
    $.getJSON("/items_json/", params, function(results) {
        clearLoading();
        renderItems(results);
    });
}

function renderItems(items) {
    for (var i=0; i<items.length; i++) {
        var $arr = {};
		var item = items[i];
        var $item = getItemHTML(item);

		$arr = getItemHTML(item);
		var $item = $arr[0];
		var $drag_img = $arr[1];
		$drag_img.draggable({
			revert : false,
			containment : "wrapper",
			helper : "clone"
		});
	
        $('#listView').append($item);   
    }
}

function getItemHTML(item) {
	var $drag = {};
    var $item = $('<div />').addClass("objectEach").data("item", item).attr("id", "itemThumb" + item.id);
    var $img = $('<img />').addClass("objectThumb").attr("src", item.thumb100).attr("data-value" ,item.thumb300).appendTo($item); // HACK :- .attr repeated
	var $drag_img = $img;
    var $metadata = $('<div />').addClass("objectMetaData").appendTo($item);
    var $title = $('<p />').addClass("objectTitle").text(item.title).appendTo($metadata);
    var $dimensions = $('<p />').text(item.width + "cm").appendTo($metadata);
    var $detaillink = $('<a />').attr("href", item.details_url).addClass("viewDetails").attr("target", "_blank").attr("title", "View more").html("&#x2b;").appendTo($metadata);
    $drag[0] = $item;
    $drag[1] = $drag_img;	
    var $clear = $('<div />').addClass("clear").appendTo($item);
    //return $item;            
	return $drag;
}

function dropOnCanvas(item) {
    
    var width = item.width;
    if (width == "None") {
        width = "10";
    }
    width = parseFloat(width);
    var imgSize = parseInt(width * 60);
    
    var imgURL = item.thumb300;
    
    fabric.Image.fromURL(imgURL, function(img) {
        $('#loadingImage').hide();        
        var oImg = img.set({ left: 200, top: 100, angle: 0 }).scale(CURRENT_SCALE);
        c.add(oImg).renderAll();
    });                    
}

