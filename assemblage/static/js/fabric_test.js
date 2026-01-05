var c;
var CURRENT_SCALE = 0.5;
$(document).ready(function(){
    var width = $('#canvasView').width();
    c = new fabric.Canvas('c').setWidth(width).setHeight(600); 
    $("#e9").select2();
    fetchItems();
    $('#rotate').change(function() {
        var deg = $(this).val();
        var obj = c.getActiveObject();
        if (obj)    obj.rotate(deg);
        c.renderAll();
    });
    $('#searchList').keyup(function() {
        var q = $(this).val().toLowerCase();
        if (q === '') {
            $('.objectEach').show();
            return;
        }
        $('.objectEach').each(function() {
            var title = $(this).find('.objectTitle').text().toLowerCase();
            if (title.indexOf(q) == -1) {
                $(this).hide();
            } else {
                $(this).show();
            }
        });
    });

    $('#zoomPlus').click(function() {
        CURRENT_SCALE = CURRENT_SCALE + 0.1;
        setScale(CURRENT_SCALE);
    });

    $('#zoomMinus').click(function() {
        CURRENT_SCALE = CURRENT_SCALE - 0.1;
        setScale(CURRENT_SCALE);
    });

});

function setScale(newScale) {
    var objects = c._objects;
    //console.log(objects);
    objects.forEach(function(v, i) {
        //console.log(v);
        v.scale(newScale);
    });
    c.renderAll();
}

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
        var item = items[i];
        var $item = getItemHTML(item);
        $('#listView').append($item);                
    }
}

function getItemHTML(item) {
    var $item = $('<div />').addClass("objectEach").data("item", item).attr("id", "itemThumb" + item.id);
    var $img = $('<img />').addClass("objectThumb").attr("src", item.thumb100).appendTo($item);
//    var $addicon = $('<span />').addClass("addIcon").text("+").click(function() {
//        $('#loadingImage').show();
//        dropOnCanvas(item);
//    }).appendTo($item);

    var $metadata = $('<div />').addClass("objectMetaData").appendTo($item);
    var $title = $('<p />').addClass("objectTitle").text(item.title).appendTo($metadata);
    var $dimensions = $('<p />').text(item.width + "cm").appendTo($metadata);
    var $detaillink = $('<a />').attr("href", item.details_url).addClass("viewDetails").attr("target", "_blank").attr("title", "View more").html("&#x2b;").appendTo($metadata);
    //var $detailicon = $('<p />').addClass("viewDetails").text().appendTo($detaillink);
	//   var $detailicon = $('<img />').attr("src", "/static/img/zoom-detail.png").attr("title", "View details in new window").appendTo($detaillink);
    var $clear = $('<div />').addClass("clear").appendTo($item);
    return $item;            
}

function dropOnCanvas(item) {
    //alert(item.id);
    var width = item.width;
    if (width == "None") {
        width = "10";
    }
    width = parseFloat(width);
    var imgSize = parseInt(width * 60);
    //var imgURL = "/" + item.id + "/" + imgSize + ".png";    
    var imgURL = item.thumb300;
    //console.log(imgURL);
    fabric.Image.fromURL(imgURL, function(img) {
        $('#loadingImage').hide();        
        var oImg = img.set({ left: 200, top: 100, angle: 0 }).scale(CURRENT_SCALE);
        c.add(oImg).renderAll();
    });                    
}

