////////////////////////////////////////////////////////////////////////////////
//
// Author: Macgregor
// License: MGT
// Description: Generating html
// 
//
///////////////////////////////////////////////////////////////////////////////	

CHtml =  {

	getItemHTML : function(ix)
	{
		var elm = document.createElement('DIV');
		elm.setAttribute('name', ix );
		
		var item = CHelp._items[ix], ihtml = '<div class="objectEach"><img name="item_' + ix + '" src="' + item.thumb100 + '" alt="" class="objectThumb">';
		ihtml += '<div class="objectMetaData"><p class="objectTitle">' + item.title + '</p>';
		ihtml += item.width+"cm"; 
		ihtml += '<br><a class="viewDetails" href="' + item.details_url + '" target="_blank"  title="View more">+</a>';
		ihtml += '</div><div class="clear"></div></div>';
		
		elm.innerHTML = ihtml;
		
		return(elm);
	}

}