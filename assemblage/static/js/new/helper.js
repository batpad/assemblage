////////////////////////////////////////////////////////////////////////////////
//
// Author: Macgregor
// Description: Primary helper and entry point
// 
//
///////////////////////////////////////////////////////////////////////////////
CHelp = {

	_m_current_scale: 0.0 , 
	_m_canvas : null,
	_m_under_process : false,
	_M_TITLE : '',  
	_m_is_new_App : true,
	_m_item_title : '',
	_m_app_unsaved : false, 
	_m_canvas_scale : 1 , 
	_m_canvas_original_width : 0.0 ,
	_m_canvas_original_height : 0.0 ,
	
	canvas_view_width: 0,
	canvas_view_height: 0,
	//_SCALE_RANGE: { start: 0.1	, end: 1, step: 0.05 },	
	_SCALE_RANGE: { start: 0.1	, end: 1, step: 0.05 },	
	_m_on_block_screen : false ,
	
	init: function()
	{

		CUi.init(document);
		if(typeof(APP) !== 'undefined')
			CHelp._m_is_new_App = false;
		
		
		
		if(typeof(USER_ID)!== 'undefined' && typeof(USER_NAME)!== 'undefined') 
		{
			CHelp.userId = USER_ID ;	
			CHelp.userName = USER_NAME ;	
			CHtml.showUserLoggedIn(CHelp.userName);
		}
			
			
		CHelp._m_current_scale = document.getElementById('scale').value ;
		CHelp.cmToPxFactor = 37.795275591,  // 1 CM = 37.795 Px
		CHelp.pxToCmFactor = ( 1 / CHelp.cmToPxFactor); //0.0264620269 , // 1 px = 0.02646 Cm (factor for 100% view)
	
		CItem.fetchItems(); // fetch database items
		
		CHelp.canvas_view_width = $('#canvasView').width();
		CHelp.canvas_view_height = $('#canvasView').height();
		
		// original = maximum display
		CHelp._m_canvas_original_width = ( CHelp.canvas_view_width / CHelp._SCALE_RANGE.start );
		CHelp._m_canvas_original_height = ( CHelp.canvas_view_height / CHelp._SCALE_RANGE.start );
		
		CHelp._m_canvas = new fabric.Canvas('c').setWidth(CHelp.canvas_view_width).setHeight(CHelp.canvas_view_height);
		
		//CHelp._m_canvas.backgroundColor = new fabric.Pattern({ source: '/static/img/grid-white-large.jpg' }) ;
		//CHelp._m_canvas.backgroundColor = new fabric.Pattern({ source: '/static/img/grid-white.jpg' }) ;
		
		//CHelp._m_canvas.setBackgroundImage('/static/img/grid-white-large.jpg', CHelp._m_canvas.renderAll.bind( CHelp._m_canvas));
		//comment setBackgroundImage to make the canvas static
		
		CFab.adjustScale();
		// MAKE CANVAS DRAG-DROP AWARE
		
		$("#canvasView").droppable
		({	
			drop: function (event, ui)
			{
				var imgObj = { 	
					imgURL : ui.draggable.attr('og_img') , 
					height_cm : ui.draggable.attr('height_cm') , 
					width_cm : ui.draggable.attr('width_cm') ,
					object_id : ui.draggable.attr('objectId')
				} ; 
				
				CHtml.blockScreen('Loading image, Please wait'); // block the UI
				CFab.dropImageOnCanvas(imgObj , CHelp._m_canvas , CHelp._m_current_scale , event , false);	
			}
		}); 
		
		var scaleControl = document.getElementById('scale');
			scaleControl.onchange = function() {
				
				CHelp._m_current_scale = this.value;
				CFab.adjustScale(CHelp._m_current_scale); // SCALE THE CANVAS & SET THE SCALE GUI
				
			}; 
		$("#e9").select2();
		
		
		// OBSERVE CANVAS OBJECTS FOR  STATE MAINTAINANCE
		CHelp._m_canvas.observe('object:selected' && 'object:modified',  function(e){
			
			CHelp._m_app_unsaved = true ;
		
			var obj = CHelp._m_canvas.getActiveObject();
			
			if(obj)
			{
				if( obj.type != "group" )
				{
					if( window.event && window.event.shiftKey != true )
					{ 
						CState.saveState( CHelp._m_canvas ); 	
						CFab.keepMeInView( CHelp._m_canvas, obj ) ;
					}
				
				}
				
			}
		});
		
		if(CHelp._m_is_new_App == false)
			CHelp.loadApp();			
	},
	
	objectsOnCanvas : function()
	{
		var count = 0 ;
		CHelp._m_canvas._objects.forEach(function(v, i) {
			count++; 
		});		
	
		return(count);
	},
	
	addAsGroup : function()
	{	
		if(CPan._isActive != true)
		{
			if(CHelp.objectsOnCanvas() > 0 ||  CHelp._m_canvas.getActiveObject() != null || CHelp._m_canvas.getActiveGroup() != null)
			{
				var currGroup = CHelp._m_canvas.getActiveGroup() || CHelp._m_canvas.getActiveObject();
				if( currGroup != null || (CHelp._m_canvas.getActiveObject() != null && CHelp._m_canvas.getActiveObject().isJoinedObj == true) )
					CFab.createToDataURL(CHelp._m_canvas , CHelp._m_current_scale);
				else
					CHtml.showErrorNotification('Please select two or more objects');
			}
			else
				CHtml.showErrorNotification('Nothing to join');
		}
		else
			CHtml.showErrorNotification('Please hit ESC to exit from pan mode');
		
		
	},
	
	sendToBack : function ()
	{
		if(CPan._isActive != true)
		{
			CFab.sendToBack(CHelp._m_canvas);
		}
		else
			CHtml.showErrorNotification('Please hit ESC to exit from pan mode');
				
	},
	
	bringToFront : function()
	{
		if(CPan._isActive != true)
		{
			CFab.bringToFront(CHelp._m_canvas);
		}
		else
			CHtml.showErrorNotification('Please hit ESC to exit from pan mode');
		
	},
	
	deleteObjects : function()
	{
		if(CPan._isActive != true)
		{
			CFab.deleteObjects(CHelp._m_canvas);
		}
		else
			CHtml.showErrorNotification('Please hit ESC to exit from pan mode');
		
	},
	
	undoShow  : function()
	{
		if(CPan._isActive != true)
		{
			CState.undoShow(CHelp._m_canvas);
		}
		else
			CHtml.showErrorNotification('Please hit ESC to exit from pan mode');
		
	} ,
	
	redoShow : function()
	{
		if(CPan._isActive != true)
		{
			CState.redoShow(CHelp._m_canvas);
		}
		else
			CHtml.showErrorNotification('Please hit ESC to exit from pan mode');
		
	} ,
	
	exportAsObject : function()
	{
		if(CPan._isActive != true)
		{
			if(typeof(CHelp.userId) !== "undefined")
			{
				if(CHelp.objectsOnCanvas() > 0 ||  CHelp._m_canvas.getActiveObject() != null || CHelp._m_canvas.getActiveGroup() != null)
				{
					if( CHelp._m_canvas.getActiveGroup() || ( ( CHelp._m_canvas.getActiveObject() ) && ( CHelp._m_canvas.getActiveObject().isJoinedObj == true ) ) )
					{
						$.blockUI({ message: $('#exportForm') , onBlock:function(){CHelp._m_on_block_screen = true ;}});  
					}
					else
						CHtml.showErrorNotification('Please select two or more objects');
				}	
				else
					CHtml.showErrorNotification('Nothing to export');
			}
			else
				CHtml.showErrorNotification('Please sign in to export object');
		}
		else
			CHtml.showErrorNotification('Please hit ESC to exit from pan mode');
		
	} , 
	
	newApp : function()
	{
		// SHOW the message with 3 options SAVE , DON'T SAVE , CANCEL  from UNSAVED canvas
		if( CHelp._m_app_unsaved == true )
		{
			$.blockUI({message: $('#newAppForm') ,  onBlock:function(){CHelp._m_on_block_screen = true ;}});
		}
		else
		{
			document.location.replace("/app");
		}
	},
	
	saveApp : function( isSaveAs )
	{
		if(typeof(CHelp.userId) !=="undefined")
		{
			if(CHelp.objectsOnCanvas() > 0 )
			{
				if( CHelp._m_app_unsaved == true )
				{
					if( CHelp._M_TITLE.length > 0 && !isSaveAs )
					{
						if( CHelp._m_under_process == false )
							CVal.sendContentToServer();	
						else
							CHtml.showErrorNotification('Unable to save at this time');
					}
					else
						CHtml.showTitleForm();
				}
				else
				{
					CHtml.showErrorNotification("No unsaved changes");
				}
			}
			else
				CHtml.showErrorNotification('Nothing to save');
		}
		else
			CHtml.showErrorNotification("Please sign in to save this build");
	} , 
	
	loadApp : function(serial_state)
	{
		console.log("load the appppp");
		CHelp._M_TITLE = APP.title;
		
		console.log(APP.fabric);
		CHelp._m_canvas.loadFromJSON(JSON.stringify(APP.fabric) ,function () {
				
				CHelp._m_canvas.renderAll();
				CHelp._m_current_scale = CHelp._m_canvas.item(0).getScaleX() ;//The scale of any canvas object is uniform
				CFab.scaleCanvas();
				CState.saveState(CHelp._m_canvas);
				
				var objects = CHelp._m_canvas._objects;
				objects.forEach(function(v, i) { //HACK to load with object's border structure
					v.set({lockScalingX:true , lockScalingY:true , hasRotatingPoint:true , hasEndPoints:false , hasControls: true });
				});
				
				CHtml.setScaleUI(CHelp._m_current_scale); // set the UI of Range bar
				
				$("#appNameView").show();
				$(".uppercase").text(CHelp._M_TITLE);
			});	
	},
	
	showAppList : function()
	{
		CItem.fetchApps();
	},
	
	print : function()
	{	
		if(CHelp._m_under_process == false)
		{
			if(CHelp.objectsOnCanvas() > 0)
				CEx.showPrintPage(CHelp._m_canvas , $("#c").offset().left , $("#c").offset().top  , $("#canvasView").width() , $("#canvasView").height() , $('#canvasView').scrollLeft(), $('#canvasView').scrollTop());
			else
				CHtml.showErrorNotification('Nothing to print');
		}
		else
			CHtml.showErrorNotification('Unable to print at this time');
	} ,
	
	showSignUpForm : function(event)
	{
		$('#signUpError').hide();
		$.blockUI({message: $('#signUp') , onBlock:function(){CHelp._m_on_block_screen = true ;}});
	},
	
	showSignInForm : function()
	{
		$('#signInError').hide();	
		$.blockUI({message: $('#signIn') , onBlock:function(){ CHelp._m_on_block_screen = true ; } } );	
	},
	
	enumerateGroup : function()
	{
		var currGroup = CHelp._m_canvas.getActiveGroup() ; //
		
			
		var ddata = new Array();
		var groupx = currGroup.left ;
		var groupy = currGroup.top ;
		var item_ids = [];
		
		if(currGroup.type == "group")
		{
			currGroup.forEachObject( function(o,i) 
			{
				var object_json = {
				groupX : currGroup.width/2 , 
				groupY : currGroup.height/2 ,
				objX : o.getLeft() ,
				objY : o.getTop()
				}
				
				//console.dir(object_json);
				
				var myO = {
					canvasLeftX: parseFloat((o.oCoords.tl.x + ((currGroup.width)/2)) / scale),
					canvasLeftY: parseFloat((o.oCoords.tl.y + ((currGroup.height)/2 ))/ scale),
					src: o.getSrc() ,
					id : o.object_id
				};
				
				ddata.push( myO );
				item_ids.push(myO.id);
				
				// In case of JOIN remove the objects where as in Export keepobjects  on the canvas
				if(typeof(itemTitle) === "undefined")  
				{
					//c.remove(o);
				}
			
			} );
			CHelp._m_canvas.discardActiveGroup(currGroup);	
		}
	} ,

	signOutUser : function()
	{
		$.get("/signout",function(response){
			
			if( response.success && response.success.length > 0)
			{
				// delete these vars so that we can check the the type "undefined" while page loads
				delete CHelp.userId; 
				delete CHelp.userName;
					
				CHtml.showSignInSignOut();
				
				CHtml.blockScreen("Logged out successfully");
				
				setTimeout(function(){CHtml.unBlockScreen();} , 2000) ;
				
			}
		
		},'json');
		
	}
	
	
}
