////////////////////////////////////////////////////////////////////////////////
//
// Author: Macgregor
// Description: Access the database items
// 
//
///////////////////////////////////////////////////////////////////////////////
CItem = {

    totalPages:  1,

	fetchItems : function (search_params, callback)  
	{        
        if (typeof(callback) == 'undefined') {
            callback = $.noop;
        }
		var params = search_params || {};
		$.getJSON("/items_json/", params, function(results) {
			CItem.renderItems(results.items);
            CItem.totalPages = results.total_pages;
            callback();
		});	
	},
	
	renderItems : function (items) 
	{
        $('#listView').find('.loadingDiv').remove();
		for (var i=0; i<items.length; i++) 
		{
			var $arr = {};
			var item = items[i];
			
			item.width_cm = item.width;
			item.height_cm = ((parseFloat(item.height_px) / parseFloat(item.width_px)) * parseFloat(item.width_cm));
			
			$arr = CHtml.getItemHTML(item); //Get Item Html from the html.js

			var $item = $arr[0];
			var $drag_img = $arr[1];
			
			$drag_img.draggable( {
				revert : "invalid",
				containment : "wrapper",
				helper : "clone",
				scroll : false,
				zIndex: 100
			}); 
		
			$('#listView').append($item);   
			
			$('.objectThumb').dblclick(
				function(e){
				var currObj = e.currentTarget ;
				
				var imgObj = { 	
						imgURL : currObj.attributes[3].value,
						height_cm : currObj.attributes[4].value , 
						width_cm : currObj.attributes[5].value ,
						object_id : currObj.attributes[6].value
				} ; 
				
				e.stopImmediatePropagation();
				CHtml.blockScreen('Loading image, Please wait'); // block the UI
				CFab.dropImageOnCanvas( imgObj , CHelp._m_canvas , CHelp._m_current_scale , e , true );	//true-> double clicked
				return false;
			});
		}
	},
	
	fetchApps : function ()  
	{
		var params = {};
		$.getJSON("/get_apps", params, function(results) {
			
			if(!results.error)
			{
				CItem.renderApps(results);
			}
			else
				CHtml.showErrorNotification(results.error);
		});	
	},
	
	renderApps : function (apps) 
	{
		$('#appView1').empty();
		for (var i=0; i<apps.length; i++) 
		{
			var app = apps[i];
			
			$app = CHtml.getAppHTML(app); //Get Item Html from the html.js
	
			$('#appView1').append($app);
		}
		
		if( apps.length > 0)
			$.blockUI({ message: $('#load-app') ,  css: { top: '20%', height: '360px' } });  
		else
		{
			$.blockUI({ message: $('<div style="color:red;height:50px;">Sorry no saved Apps for current user</div>')   });  
			
			 setTimeout( function(){CHtml.unBlockScreen(event)} , 2000); 
			
		}

	}
}
