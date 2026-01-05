////////////////////////////////////////////////////////////////////////////////
//
// Author: Macgregor
// Description: Assign keyboard shortcurts
// 
//
///////////////////////////////////////////////////////////////////////////////

		$(document).bind('keydown', 'z',function (evt){ // Undo
				
				if(CHtml.isTagNameInput(evt) != true)
				{
					CHelp.undoShow();
				
					return false;
				}
				});	
				
		//2
		$(document).bind('keydown', 'y',function (evt){ // Redo
				if(CHtml.isTagNameInput(evt) != true) 
				{
					CHelp.redoShow();
					return false;
				}
			
				});	
		//3
		$(document).bind('keydown', 'del',function (evt){ // delete
				if(CHtml.isTagNameInput(evt) != true)
				{
					CHelp.deleteObjects();
					return false;
				}
				
				});	
		
		//4
		$(document).bind('keydown', 'q',function (evt){ // Zoom In
			if(CHtml.isTagNameInput(evt) != true)	
			{
				CFab.scaleWithKeyboardShortcut(true);
				
				return false;
			}
			
				
			});	
		//5 
		$(document).bind('keydown', 'w',function (evt){ //Zoom Out
			if(CHtml.isTagNameInput(evt) != true)	
			{
				CFab.scaleWithKeyboardShortcut();
				return false;	
			}
				
			});	
		//6
		$(document).bind('keydown', 'j',function (evt){ // Join Objects
				
				var event = evt.srcElement || evt.target ;
				
				if(CHtml.isTagNameInput(evt) != true )
				{	
					CHelp.addAsGroup();

					return false;
				}
				
				});	
		//7
		$(document).bind('keydown', 'f',function (evt){ // Bring to Front
				 	if(CHtml.isTagNameInput(evt) != true) 
					{	
						CHelp.bringToFront();
						return false;
					}
					
				
				});	
		//8
		$(document).bind('keydown', 'b',function (evt){ // Send to Back
				if(CHtml.isTagNameInput(evt) != true)
				{
					CHelp.sendToBack();
					return false;
				}
				
				});	
		//9
		$(document).bind('keydown', 'p',function (evt){ // Pan Canvas
				if(CHtml.isTagNameInput(evt) != true)
				{
					CPan.toggleActivate();
				
					return false;
				}
				
				});	
		//10
		$(document).bind('keydown', 'Alt+s',function (evt){ // Save App
				
				if(CHtml.isTagNameInput(evt) != true)
				{
					CHelp.saveApp();
					
					return false;
				}
				
				});	
		//11
		$(document).bind('keydown', 'Alt+e',function (evt){ // Export Object
				
				if(CHtml.isTagNameInput(evt) != true)  
				{
					evt.preventDefault();
					CHelp.exportAsObject();
					console.log("go on ");
					
				}
				return false;
				});	
		//12
		$(document).bind('keydown', 'Alt+o',function (evt){ // Open  App
				if(CHtml.isTagNameInput(evt) != true) //Check whether the event is coming from the input tag
				{
					CHelp.showAppList();
					return false;
				}
				
				});	
		//13
		$(document).bind('keydown', 'Alt+n',function (evt){ // New App
				if(CHtml.isTagNameInput(evt) != true)  
				{
					CHelp.newApp();
				
					return false;
				}
				
				});	
		//14
		$(document).on('keydown', function(e) { 
			if (e.which === 27) // Escape key
			{ 
				if(CHelp._m_on_block_screen == true  )   // If blocked screen then allow escape
				{
					CHtml.unBlockScreen();
				}
				
				if( CPan._isActive == true ) // On escape unPan the canvas 
					CPan.toggleActivate();
				
			}
			
		});
	
		$(document).bind('keydown', 'Alt+r',function (evt){ // New App
				if(CHtml.isTagNameInput(evt) != true)  
				{
					evt.preventDefault();
					CHelp.print();
				}
				return false;
				});	
		$(document).bind('keydown', 'Alt+a',function (evt){ // Save App
				
				if(CHtml.isTagNameInput(evt) != true)
				{
					CHelp.saveApp(true); //True for saveAs
					
					return false;
				}
				
				});	
		/* hot keys end */