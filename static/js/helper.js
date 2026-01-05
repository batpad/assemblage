////////////////////////////////////////////////////////////////////////////////
//
// Author: Macgregor
// Liscense: MGT
// Description: Primary helper and entry point
// 
//
///////////////////////////////////////////////////////////////////////////////
CHelp = {
	_M_API_ITEMS: 'items_json/',
	_items: false,
	_itemListElm: false,
	
	init: function(doc)
	{
		CUi.init(doc);
		CDraw.init();
		
		CHelp._itemL1istElm = document.getElementById('listView');
		
		if(CUtil.varok(CHelp._itemListElm))
		{
			CHelp._itemListElm.innerHTML = '';
			
			setTimeout( CHelp.initItems, 10 );
		}
	},
	
	initItems: function()
	{
		CUi.showWorking();
		CTalk.sendSimplePost( CHelp._M_API_ITEMS, function(json) {
			CUi.hideWorking();
			if(json)
			{
				CHelp._items = (eval(json));
				//TODO: calcualte items stuff
				CHelp.displayItems();
			}
			else
				alert('Something went wrong, please contact support.');
		} );
	}, // end of initItems
	
	displayItems: function()
	{
		for( var ix in CHelp._items )
		{
			var elm = CHelp.getItemO(ix);
			//CHelp._itemListElm.appendChild(elm);
			CHelp._itemListElm.innerHTML = elm;
		}
	},
	
	getItemO: function(ix)
	{
		return(CHtml.getItemHTML(ix)); //get html for every item
	},
	
	imageHist: new Array(),
	
	addHistory: function(imgS)
	{
		CHelp.imageHist.push( imgS );	
	},
	
	enumHist: function(cb)
	{
		for( var i in CHelp.imageHist )
		{
			cb( CHelp.imageHist[ i ] );
		}
	}
};