
$(document).ready(function() {
    //$('#searchList').select2({tags:["red", "green", "blue", "purple", "pink", "slate"]}); 
    
	$('body').attr('id',"whitegrid"); //default grid
	
	$('#selectSwatches').change(function() {
		var option = $(this).val();
		//alert("changed");
		$('body').attr('id',option);
	});
	
	$('.contactLink').click(function(){
		$('.contactLinkDetails').toggle();
	});
	
	$(window).resize(function(){
        if ($('#listSearchBlock').length === 0) {
            return;
        }
        var offsetTop = $('#listSearchBlock').offset().top + 30;
        var newHeight = $(window).height() - offsetTop;
		var searchHeight = $('#searchFilterBlock').height();
		var canvasIconHeight = $('#canvasIconOptions').height();
       
	    $('#listSearchBlock').height(newHeight);
       
	    $('#listView').height(newHeight - searchHeight - 50);
       
	    $('#canvasView').height(newHeight - canvasIconHeight - 1);

/*		var offsetLeft = $('#listSearchBlock').width();    
        var newWidth = $(window).width() - offsetLeft - 65;    
        $('#canvasViewWrapper, #canvasIconOptions').width(newWidth);
*/ 
    });


    $(window).resize();
	 
    $('#exampleSlider1').noUiSlider('init', {
	    handles: 1,
	    connect: "lower"
    });
});    

$(window).load(function() {
    $(window).resize();
});
