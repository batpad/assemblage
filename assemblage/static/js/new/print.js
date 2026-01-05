////////////////////////////////////////////////////////////////////////////////
//
// Author: Macgregor
// Liscence: MGT
// Description: Print canvas
// 
//
///////////////////////////////////////////////////////////////////////////////

CPrint = {

	onLoad : function(variable)
	{
		console.log("var is :- > "+variable);
		var can = CHelp.stringify();
	}	
	
}

//<div id="canvasControls"><p class="rangeBlock">Scale: <input type="range" id="scale" class="range" min="0.1" max="2" value="0.2" step="0.1"/></p><div class="conversion"><p class="cm">5cm</p><p class="px">&#160;</p></div></div><div> <div id="canvasView"> <canvas id="d" width=1000px height=600px></canvas></div></div><br/>