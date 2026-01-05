////////////////////////////////////////////////////////////////////////////////
//
// Author: Macgregor
// Description: Generate Html
// 
//
///////////////////////////////////////////////////////////////////////////////
CHtml = {

	getItemHTML : function(item)
	{
		//Convention :- $ represents jQuery variable
		var $element = {};
		var $item = $('<div />').addClass("objectEach").data("item", item).attr("id", "itemThumb" + item.id);
		var $imgWrap = $('<div />').addClass("objectWrap").appendTo($item) ;
		var $img = $('<img />').addClass("objectThumb").attr("src", item.thumb100).attr("data-value" ,item.thumb300).attr("og_img",item.image_url).attr("height_cm",item.height_cm).attr("width_cm",item.width_cm).attr("objectId",item.id).appendTo($imgWrap); 
		// draggable element
		
		var $metadata = $('<div />').addClass("objectMetaData").appendTo($item);
		var $title = $('<p />').addClass("objectTitle").text(item.title).appendTo($metadata);
		
		var $dimensions = $('<p />').text(item.width + "cm").appendTo($metadata);
		
		var $detaillink = $('<a />').attr("href", item.details_url).addClass("viewDetails").attr("target", "_blank").attr("title", "View more").html("&#x2b;").appendTo($metadata);
		
		$element[0] = $item;
		$element[1] = $img;	//draggable
		var $clear = $('<div />').addClass("clear").appendTo($item);     
				
		return $element;
	},
	
	getAppHTML : function(app) //DISPLAY THE APP LIST WHEN CLICKED ON THE LOADAPP
	{	
		var $app =  $('<p />').html('<div class="formLoad"><a href='+app.url+'> '+app.name+ '</div>');
		var $clear = $('<div />').addClass("clear").appendTo($app);           
		return $app;
	},
	
	showErrorNotification : function(msg)
	{
		$.growlUI('' , '<h5>'+msg+'</h5>' ,  5000);
	},

	blockScreen : function(msg)
	{
		//CHelp._m_under_process = true ; // under process flag
		$.blockUI({ message: "<div style='width:100%;padding-top:10px;padding-bottom:30px; top: 20%;'><div style='float:left;width:15%'><img src='/static/img/progmd.gif' align=center/></div><div style='width:70%;float:left;'>"+msg+"</div>" }); 
		
	}, 

	unBlockScreen : function(event)
	{
		if(event)
			event.preventDefault();
		$.unblockUI({ 
	                onUnblock: function(){ CHelp._m_under_process = CHelp._m_on_block_screen = false ; }
	      }); 
	},
	
	
	showTitleForm : function()	
	{
		if(typeof(CHelp.userId) !== "undefined")
			$.blockUI({ message: $('#nameForm') , onBlock:function(){CHelp._m_on_block_screen = true ;} ,css: blockUICSS});  
		else
			CHtml.showErrorNotification("User is not logged , Please sign in");
	},
	
	setScaleUI : function( scale )
	{
		$('#scale').val(scale);
		CFab.setScaleIndicator( scale ); 
	},
	
	isTagNameInput : function(event)
	{
		return ( (event.srcElement || event.target).tagName == "INPUT" )  ;
	},
	
	showUserLoggedIn : function(username)
	{
		$("#loginForms").html("<span class='signupLink'>Logged In as "+(username)+"</span> | <span class='signInLink' onclick='CHelp.signOutUser();' >Sign Out</span>");
	},
	
	showSignInSignOut:function()
	{
		$("#loginForms").html("<span class='signupLink' onclick='CHelp.showSignUpForm(event);' >Sign-Up</span>/<span class='signInLink' onclick='CHelp.showSignInForm(event);' >Sign-In</span>");
	}
	
	
}