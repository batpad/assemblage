////////////////////////////////////////////////////////////////////////////////
//
// Author: Macgregor
// Description: Canvas state  maintainance for undo-redo
// 
//
///////////////////////////////////////////////////////////////////////////////

CPan = {
	
	_isActive: false,
	
	_canvases: new Array(),
	
	counter : -1 ,
	stack : [] ,
	_mouseStart: { x: 0, y: 0},
	_originalCanvasStart : { x: 0, y: 0 }, 
	_originalScrollStart : { x: 0, y: 0 }, 
	_inPan : false,
	_TMP_IMG : null ,
	leftNew : 0 ,
	topNew : 0 ,
	
	toggleActivate: function()
	{
		if(CHelp.objectsOnCanvas() > 0)
		{
			CPan._isActive = !CPan._isActive;
		
			if(CPan._isActive)
			{
				$("#panIcon").css('background-color' , 'gray');
				
				CHelp._m_canvas.deactivateAll(); // Deactivate All the current selections
				CHelp._m_canvas.forEachObject(function(object){ object.selectable = false }) ; // Disable object selection
				
				CHelp._m_canvas.selection = false; // Disable the global canvas selection 
				
				CHelp._m_canvas.renderAll();
				
				CUi.setMouseRawCB( CPan._touchStart, CPan._touchMove, CPan._touchEnd );		
				
				CPan._canvases = document.getElementsByTagName('CANVAS');

				fabric.pan_state.ison = true;
				fabric.pan_state.cursor = ($.browser.mozilla)?('-moz-grab'):('-webkit-grab');					
			}
			else
			{	
				$("#panIcon").css('background-color' , 'transparent'); // deactivate the Pan Button
				
				CUi.reSetMouseRawCB();
				
				CHelp._m_canvas.forEachObject(function(object){ object.selectable = true }) ; //Enable object selection
				
				CHelp._m_canvas.selection = true; // Enable the global canvas selection 

				fabric.pan_state.ison = false;
				fabric.pan_state.cursor = '';					
			}
			
		}	
		else
			CHtml.showErrorNotification('Canvas is empty');
	},
	
	showObjectState:function()
	{
		var scroll_cur = CPan.getScrollCurMax();
		//console.dir(scroll_cur);
		
		var obj = CHelp._m_canvas.item(0);
	},
	
	adjustCenterIncrease: function(scroll_old)
	{
		var scroll_cur = CPan.getScrollCurMax();
		
		var newL = 0, newT = 0;
		
		if( scroll_old.ml == 0 )
			newL = parseInt(scroll_cur.ml / 2);
		else
		{
			var newLR = scroll_cur.ml / scroll_old.ml;
			newL = parseInt(scroll_old.l * (newLR));
		}
		
		if( scroll_old.mt == 0 )
			newT = parseInt(scroll_cur.mt / 2);
		else
		{
			var newTR = scroll_cur.mt / scroll_old.mt;
			newT = parseInt(scroll_old.t * (newTR));
		}
		
		$('#canvasView').scrollLeft( newL );	
		$('#canvasView').scrollTop( newT );
	},
	
	_touchStart: function(e)
	{
		var bDidSomething = false;
		e = e || window.event;
		var targetElement = e.target || e.srcElement;

		if( e.which == 1 ) //LEFT CMOUSE CLICK
		{				
			var ttag = targetElement.tagName;
			
			if( ttag == 'CANVAS' )
			{	
				CPan._inPan = true;	

				fabric.pan_state.cursor =  (CUi._isFF)?('-moz-grabbing'):('-webkit-grabbing');
				CPan._mouseStart = CPan.getPoint(e);	
				CPan._originalScrollStart = CPan.getScrollPos();
				CPan.repositionScroll(e);
				
				bDidSomething = true;
			}
		}
		
		if(bDidSomething)
			CPan.stopPropogation( e );
			
		return(true);
	},
	
	_touchMove: function(e)
	{
		var bDidSomething = false;
		e = e || window.event;
		
		if( CPan._inPan == true )
		{
			CPan.repositionScroll(e);			
			bDidSomething = true ;
		}
		
		if(bDidSomething)
			CPan.stopPropogation( e );
		
		return(true);
	}, // END OF TOUCH MOVE
	
	_touchEnd: function(e,i)
	{	
		var bDidSomething = false;
		e = e || window.event;
		
		if( CPan._inPan == true )
		{
			CPan._inPan = false;
			CPan.repositionScroll(e);
			
			CPan._mouseStart.x = 0;
			CPan._mouseStart.y = 0;	
			
			CPan._originalScrollStart.x = 0;
			CPan._originalScrollStart.y = 0;
			
			//fabric.pan_state.cursor = '-moz-grab';	
			fabric.pan_state.cursor = ($.browser.mozilla)?('-moz-grab'):('-webkit-grab');	
			bDidSomething = true;
		}
		
		if(bDidSomething)
			CPan.stopPropogation( e );
		
		return(true);
	},
	
	getScrollPos: function()
	{
		return ( { x: $('#canvasView').scrollLeft(), y: $('#canvasView').scrollTop() } );
	},
	
	getCanvasPos: function()
	{
		return( { x: $(CPan._canvases).position().left, y: $(CPan._canvases).position().top } );
	},
	
	repositionScroll: function(e)
	{		
		var npoint = CPan.getPoint(e);
				
		var newScrollLeft = CPan._originalScrollStart.x + ( CPan._mouseStart.x - npoint.x );
		var newScrollTop = CPan._originalScrollStart.y + ( CPan._mouseStart.y - npoint.y );
				
		$('#canvasView').scrollLeft( newScrollLeft );
		$('#canvasView').scrollTop( newScrollTop );
	},
	
	repositionCanvas: function(e)
	{	
		var npoint = CPan.getPoint(e);
		
		var leftNew = CPan._originalCanvasStart.x + ( npoint.x - CPan._mouseStart.x );
		var topNew = CPan._originalCanvasStart.y + ( npoint.y - CPan._mouseStart.y );
		
		for( var ci in CPan._canvases)
		{
			$(CPan._canvases[ci]).css({left: leftNew+'px'});
			$(CPan._canvases[ci]).css({top: topNew+'px'});
			
		}
	},
	
	stopPropogation: function(e)
	{
		try {
			e.cancelBubble = true;		
			if(e.stopPropagation) { e.stopPropagation(); }					
			if(e.preventDefault) { e.preventDefault(); }		
		} catch(e) { }
	},
	/*
	adjustCenterIncrease: function(oldD, newD)
	{
		console.log('newWidth -> '+newD.w+' newHeight -> '+newD.h+' oldWidth -> '+oldD.w+' oldHeight ->'+oldD.h);
		
		//$('#canvasView').scrollLeft( ( newD.w - oldD.w ) / 2 );	
		//$('#canvasView').scrollTop( ( newD.h - oldD.h ) / 2 );	
		
		$('#canvasView').scrollLeft( ( oldD.w - newD.w ) / 2 );	
		$('#canvasView').scrollTop( (oldD.h - newD.h ) / 2 );	
		console.log( 'new Width Factor -> '+( ( oldD.w - newD.w ) / 2 ) + ' new HFac -> '+( (oldD.h - newD.h ) / 2 )+' oWF -> '+ ( ( newD.w - oldD.w ) / 2 ) + 'oHF ->'+( ( newD.h - oldD.h ) / 2 ));
	},
	*/
	getPoint: function(e)
	{
		return( { x: e.pageX, y: e.pageY } );
		// NOTE: does not consider scroll, thus body should never have scroll bars
		
		/*var x = CUi._mouseX, y = CUi._mouseY;
		if(CUi._isSF || CUi._isCH)
		{
			x += CUi.bod.scrollLeft;
			y += CUi.bod.scrollTop;
		}
		
		return [x , y];
		*/
	},
	
	setCursor: function(cursor_name)
	{
		CPan._canvases = document.getElementsByTagName('CANVAS');
		for(var ix in CPan._canvases)
		{
			CPan._canvases[ix].style.cursor = cursor_name;
		}			
	},
	
	getScrollCurMax: function()
	{
		var x = document.getElementById('canvasView');
		return( { l: $('#canvasView').scrollLeft(), t: $('#canvasView').scrollTop(), ml: ($('#canvasView')[0].scrollWidth - $('#canvasView')[0].clientWidth ), mt: ( maxTopScroll =  $('#canvasView')[0].scrollHeight - $('#canvasView')[0].clientHeight )} ); 
	}
}