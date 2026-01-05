////////////////////////////////////////////////////////////////////////////////
//
// Author: Macgregor
// Liscence: MGT
// Description: Print canvas
// 
//
///////////////////////////////////////////////////////////////////////////////

/*
	1) Create the to.dataURL()
	2) Show as png
	3) show the region
*/


CEx = {

	showPrintPage : function( canvas , left , top , width , height , scrollLeft , scrollTop)
	{
		CHelp._m_canvas.deactivateAll(); //important
		
		//var raw_print_img = CHelp._m_canvas.toDataURL();
		
		var cm_scale = CFab._m_cm_scale;
		
		CEx.getRawImageCanvas(  width , height , scrollLeft , scrollTop, function(prn_src) {		
			left=0;top=0;
			
			window.div_style ="width:"+width+";height:"+height+";position:relative;left:"+left+";top:"+top+";background-color:black;"; //here 
			
			var w = window.open('', 'wnd');
			
			var html = '<html><head>' + document.getElementsByTagName('head')[0].innerHTML +'<style media="screen">.noPrint{ display: block; }.yesPrint{ display: block !important; }</style><style media="print">.noPrint{ display: none; }.yesPrint{ display: block !important; }</style></head>';
			
			html += "<script>\n window._STATE = '" + prn_src + "';\n </script>";
			html += "<script>\n window._SCALE = '" + cm_scale + "';\n </script>";
			html += "<script>\n var can = '';\n </script>";
			
			html += '<body style="overflow:auto;"><div><div style=float:left> <div id="canvasViewDummy"><div class="yesPrint" style='+window.div_style+'>';
			
			html += '<img src="' + prn_src + '" border=0 height="'+height+'" width="'+width+'" />';
			
			html += '</div></div>'; //current open 2 divs
			html += '</div><div class=noPrint style="float:left;padding-left:10px;"><p class="cm" style="font-size:13px;">'+cm_scale+'cm</p><p class="px">&#160;</p></div><div class=noPrint><button onclick="window.print()" class="buttonAppStyle">Print</button></div></div><br/>'; 
			
			html += '</body></html>';
			
			w.document.open();
			w.document.write(html);
			w.document.close();
		} );		
	},
	
	getRawImageCanvas : function (_width , _height , scrollLeft , scrollTop, cb)
	{ //This is doing one and the same thing
			
		var imgSrc = new Image();
		imgSrc.src = CHelp._m_canvas.toDataURL();
		
		var canv = document.createElement('canvas');
	
		canv.width = _width; 
		canv.height = _height;
	
		var context = canv.getContext('2d');
		
		setTimeout( function () {
			context.drawImage( imgSrc, scrollLeft , scrollTop , _width, _height, 0 , 0 , _width, _height );
			cb(canv.toDataURL());
		}, 50 );
		
		//return canv.toDataURL();
	} ,
	
	showImageOnCanvas : function()
	{
	}

	/*	
	get scrollLeft & scrollTop of the canvas view
	create a memory canvas with the same canvas width & height
	*/
	
	/*
		source left & top are scroll left & scroll top
		destination left & top are 0,0 
	*/
}