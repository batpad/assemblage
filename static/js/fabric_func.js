////////////////////////////////////////////////////////////////////////////////
//
// Author: Macgregor
// License: MGT
// Description: Fabric related implementation
// 
//
///////////////////////////////////////////////////////////////////////////////	

CFab =  {
	
	dropOnCanvas : function(width, imgURL)
	{
		var c = new fabric.Canvas('c').setWidth(800).setHeight(600); 
		
		if (width == "None") {
			width = "10";
		}
		width = parseFloat(width);
		var imgSize = parseInt(width * 60);
		
		fabric.Image.fromURL(imgURL, function(img) {
			
			var oImg = img.set({ left: 200, top: 100, angle: 0 }).scale(0.5);
			c.add(oImg).renderAll();
		});                    
	}
}