CDraw = {
	_inImageDrag: false,
	_isImageLoading: false,

	_i: false,
	
	init: function()
	{
		CDraw._zoomLevel = 1;
		CDraw._canvas = document.getElementById('canvas_real'); // canvas_real
		CDraw.setCCursor();
		CUi.setMouseRawCB( CDraw._touchStart, CDraw._touchMove, CDraw._touchEnd );
	},
	
	_touchStart: function(e)
	{
		var targetElement = e.target || e.srcElement;
		e = e || window.event;
		if( CDraw._inImageDrag != true )
		{
			console.log("target element name is "+targetElement.name);
			if( ( targetElement.tagName == 'IMG' ) && ( targetElement.name.substring(0,('item_').length) == 'item_' ) )
			{
				CDraw._inImageDrag = true;
				CDraw._imageInDragIX = targetElement.name.substring(('item_').length);
				console.log("this is it "+CDraw._imageInDragIX);
				CDraw._dragStartX = CDraw.getPointX();
				CDraw._dragStartY = CDraw.getPointY();

				var _arrPos = CUtil.findPosRelativeToViewport( targetElement );
				
				CDraw._dragOrgImageStartX = _arrPos[ 0 ];
				CDraw._dragOrgImageStartY = _arrPos[ 1 ];
				
				CDraw._dragTempImg = targetElement.cloneNode( false );
				CDraw._dragTempImg.setAttribute( 'name', "_tmp_" );
				
				CDraw._dragTempImg.style.position = "absolute";
				CDraw._dragTempImg.style.left = CDraw._dragOrgImageStartX + "px";
				CDraw._dragTempImg.style.top = CDraw._dragOrgImageStartY + "px";
				
				
				CUi.doc.body.appendChild( CDraw._dragTempImg );
				console.log("appended or not "+CUtil.varok( CDraw._dragTempImg ));	
			}
			else if( ( targetElement.tagName == 'CANVAS' ) )
			{
				CDraw._dragCImgStart = { x: CDraw.getPointX() , y: CDraw.getPointY() };
				CDraw._isDraggingCanvasImg = true;
				CDraw.setCCursor('grabbing');
			}
		}
		else
			return(false);
		
		CUtil.stopEventBubble(e);
		return(true);
	},
	
	_touchMove: function(e)
	{
		e = e || window.event;
		
		if( CDraw._inImageDrag == true )
		{
			var leftNew = CDraw._dragOrgImageStartX + ( CDraw.getPointX() - CDraw._dragStartX );
			var topNew = CDraw._dragOrgImageStartY + ( CDraw.getPointY() - CDraw._dragStartY );
			
			CDraw._dragTempImg.style.left = leftNew + "px";
			CDraw._dragTempImg.style.top = topNew + "px";
		}
		else if( CDraw._isDraggingCanvasImg == true )
		{
			CDraw.moveImage( { x: (CDraw.getPointX() - CDraw._dragCImgStart.x), y: (CDraw.getPointY() - CDraw._dragCImgStart.y) } );
			CDraw._dragCImgStart.x = CDraw.getPointX();
			CDraw._dragCImgStart.y = CDraw.getPointY();
		}
		
	},
	
	_touchEnd: function(e)
	{
		e = e || window.event;
		
		if( CDraw._inImageDrag == true )
		{
			CDraw._inImageDrag = false;
			if( CUtil.varok( CDraw._dragTempImg ) )
				document.body.removeChild( CDraw._dragTempImg );
				
			CDraw._dragStartX = 0;
			CDraw._dragStartY = 0;	
			
			CDraw._dragOrgImageStartX = 0;
			CDraw._dragOrgImageStartY = 0;
			
			if(CUtil.isPointInRect( CUtil.getObjectDimOff(CDraw._canvas), CDraw.getPoint() ) )
				CDraw.loadImageInCanvas( CDraw._imageInDragIX );
			
			CDraw._imageInDragIX = -1;
		}
		else if( CDraw._isDraggingCanvasImg == true )
		{
			CDraw.moveImage( { x: (CDraw.getPointX() - CDraw._dragCImgStart.x), y: (CDraw.getPointY() - CDraw._dragCImgStart.y) } );
			CDraw._dragCImgStart.x = CDraw.getPointX();
			CDraw._dragCImgStart.y = CDraw.getPointY();
			CDraw._isDraggingCanvasImg = false;
			CDraw.setCCursor();
		}
	},
	
	clickZoomIn: function()
	{
		if(CDraw._zoomLevel < 10 )
		{
			CDraw._zoomLevel += 0.1;	
			CDraw.redraw();
		}
	},
	
	clickZoomOut: function()
	{
		if(CDraw._zoomLevel > 0.2 )
		{
			CDraw._zoomLevel -= 0.1;	
			CDraw.redraw();
		}
	},
	
	clickRotateLeft: function()
	{
		CDraw.rotateImage(CDraw._i);
	},
	
	setCCursor: function(dc)
	{
		if(dc == 'grabbing')
		{
			if(CUi._isFF)
				CDraw._canvas.style.cursor = '-moz-grabbing';
			else
				CDraw._canvas.style.cursor = 'move';
		}
		else
		{
			if(CUi._isFF)
				CDraw._canvas.style.cursor = '-moz-grab';
			else
				CDraw._canvas.style.cursor = 'hand';
		}
	},
	
	moveImage: function(d)
	{
		this._i.x += d.x;
		this._i.y += d.y;
		this.redraw();
	},
	
	redraw: function()
	{
		setTimeout( function() { CDraw.draw( CDraw._canvas.getContext('2d') ) }, 10 );
	},
	
	draw: function(ctx)
	{
		ctx.clearRect( 0, 0, CDraw._canvas.width, CDraw._canvas.height);
		
		CHelp.enumHist( function(hi) {
			CDraw.drawImage( ctx, hi );
		} );
		
		if(CDraw._i != false)
		{
			CDraw.drawImage( ctx, CDraw._i );
		}
	},
	
	drawImage: function(ctx, i)
	{
		var nw = (i.w * CDraw._zoomLevel), nh = (i.h * CDraw._zoomLevel);
		var nx = (i.x - ((nw - i.w) / 2)), ny = (i.y - ((nh - i.h) / 2));
		ctx.drawImage( i.img, nx, ny, nw, nh );
	},
	
	loadImageInCanvas: function(ix)
	{
		
		var item = CDraw.getItem(ix);	
		if(CDraw._isImageLoading)
		{
			alert('Please wait an image is loading.');
		}
		else
		{
			if( CDraw._canvas )
			{
				var ctx = CDraw._canvas.getContext('2d');
				
				ctx.font = "40pt Calibri";
				ctx.lineWidth=3;
				ctx.strokeStyle = "#000";
				ctx.fillStyle = "#fff";
				ctx.fillText( "Loading...", ( CDraw._canvas.width / 2 ) - 120, ( CDraw._canvas.height / 2 ) );
				ctx.strokeText( "Loading...", ( CDraw._canvas.width / 2 ) - 120, ( CDraw._canvas.height / 2 ) );
				
				CDraw._isImageLoading = true;
				
				var newImg = new Image();
				
				newImg.onload = function(){
					if( CDraw._i != false )
						CHelp.addHistory( CDraw._i );
					console.log("img is 213"+newImg);
					CDraw._i = { img: newImg };
					CDraw.addImg(ctx);
					CDraw._isImageLoading = false;
				}
				
				newImg.onerror = function() {
					CDraw._isImageLoading = false;
					CDraw.redraw();
					alert('Something went wrong, unable to load CDraw image currently.');					
				}
				
				//newImg.src = item.image_url;
				console.log("item Img url is "+item.image_url);
				newImg.src = item.image_url;
			}
		}	
	},
	
	addImg: function(ctx)
	{
		if(CDraw._i.img.width > CDraw._i.img.height)
		{
			var rat = CDraw._canvas.width / CDraw._i.img.width;
			var nheight =  parseInt(CDraw._i.img.height * rat );
			CDraw.setImageDisplay(true, 0, (CDraw._canvas.height/2) - (nheight/2), CDraw._canvas.width, nheight);
		}
		else
		{
			var rat = CDraw._canvas.height / CDraw._i.img.height;
			var nwidth = parseInt(CDraw._i.img.width * rat );
			CDraw.setImageDisplay(false, (CDraw._canvas.width/2)-(nwidth/2), 0, nwidth, CDraw._canvas.height );
		}
		
		CDraw.redraw();
	},
	
	setImageDisplay: function(isport, dx, dy, dw, dh)
	{
		CDraw._i = { img: CDraw._i.img, oimg: CDraw._i.img, rangle: 0, x: dx, y: dy, w: dw, h: dh, isPortrait: isport };
	},
	
	rotateImage: function(i, deg)
	{
		var celm = document.createElement('CANVAS');
		
		celm.width = i.w;
		celm.height = i.h;
		
		var ctx = celm.getContext('2d')
       
		//ctx.translate(celm.width / 2, celm.height / 2);
        ctx.rotate( deg * Math.PI / 180);

		ctx.drawImage( i.oimg, i.x, i.y, i.w, i.h );
		CHelp.getRotateWH()
		i.img = celm;
		
		CDraw.redraw();
	},
	
	getItem: function(ix)
	{
		return(CHelp._items[parseInt(ix)]);
	},
	
	getPointX: function()
	{
		var x = CUi._mouseX;
		if(CUi._isSF || CUi._isCH)
			x += CUi.bod.scrollLeft;
			
		return(x);
	},
	
	getPointY: function()
	{
		var y = CUi._mouseY;
		
		if(CUi._isSF || CUi._isCH)
			y += CUi.bod.scrollTop;
			
		return(y);
	},
	
	getPoint: function()
	{
		var x = CUi._mouseX, y = CUi._mouseY;
		if(CUi._isSF || CUi._isCH)
		{
			x += CUi.bod.scrollLeft;
			y += CUi.bod.scrollTop;
		}
		
		return [x , y];
	}
};
