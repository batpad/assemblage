////////////////////////////////////////////////////////////////////////////////
//
// Author: Macgregor
// Description: Canvas state  maintainance for undo-redo
// 
//
///////////////////////////////////////////////////////////////////////////////

CState = {
	
	counter : -1 ,
	stack : [] ,
	
	saveState : function(c)
	{
		var js = JSON.stringify(c);
		if(CState.stack.length != (CState.getCounter()+1) ) //if canvas objects modified while undoing 
			CState.stack = CState.stack.slice(0, CState.getCounter()+1); 
		
		CState.stack.push(js);
		CState.incrementCounter();
	} ,
	
	undoShow : function(c)
	{
		if(CState.getCounter() != -1)
		{
			CState.decrementCounter();
			var show = CState.stack[CState.getCounter()];
			c.clear();
			c.loadFromJSON(show ,function () {
				var objects = c._objects;
				objects.forEach(function(v, i) {
					v.set({lockScalingX:true , lockScalingY:true , hasRotatingPoint:true , hasEndPoints:false , hasControls: true });
				});
				c.renderAll();
				CFab.scaleCanvas(c , CHelp._m_current_scale);
			});
		}
		else
		{
			CHtml.showErrorNotification("Can't go beyond this");
			c.clear();	
		}
	},
	
	redoShow : function(c)
	{
		if(CState.getCounter() < (CState.stack.length-1))
		{
			CState.incrementCounter();
			
			var show = CState.stack[CState.getCounter()];
			
			c.loadFromJSON(show,function () {
				var objects = c._objects;
				objects.forEach(function(v, i) { //HACK to load with object's border structure
					v.set({lockScalingX:true , lockScalingY:true , hasRotatingPoint:true , hasEndPoints:false , hasControls: true });
				});
				
				c.renderAll();
				CFab.scaleCanvas(c, CHelp._m_current_scale);
			});
			
		}
		else
		{
			CHtml.showErrorNotification("Can't go beyond this");
		}
	},
	
	incrementCounter : function()
	{
		CState.counter++;
	},
	
	decrementCounter : function()
	{
		CState.counter--;
	},
	
	getCounter : function()
	{
		return (CState.counter);
	}
}