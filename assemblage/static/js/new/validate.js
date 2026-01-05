////////////////////////////////////////////////////////////////////////////////
//
// Author: Macgregor
// Description: Validating user input & making neccessary ajax calls 
// 
//
///////////////////////////////////////////////////////////////////////////////

CVal = {
	
	validateAppTitle : function(event) //validate the title App
	{	
		event.preventDefault();

		if($('#appName').val().trim().length == 0)
		{
			console.log('appName is '+$('#appName').val());
			$('#errorDiv').show();
			$('#errorDiv').html('* Please enter the name');
		}
		else 
		{
			var appTitle = $('#appName').val();
			
			
			 $.get("/check_app_name/", {name : appTitle} , function(response) {
				
                    if(response == 1) 
					{
						CHtml.unBlockScreen(event);
						CHelp._M_TITLE = appTitle ;
						CHelp.saveApp(); 
					}
					else if(response == 0)
					{
						$('#errorDiv').show();
						$('#errorDiv').html('* Sorry,name '+appTitle+' is unavailable<br/>Please try another');
					}
					
                });	
		}
	} ,
	
	validateItemTitle : function(event)
	{			
		console.log('event is '+event);
		event.preventDefault();

		if($('#itemName').val().trim().length == 0)
		{
			$('#errorDivItem').show();
			$('#errorDivItem').html('* Please enter the item name');
		}
		else 
		{
			var itemTitle = $('#itemName').val();
		
			
			$.get("/check_export_name/", {name : itemTitle} , function(response) {
				
                    if(response == 1) 
					{
						CHtml.unBlockScreen(event);
		
						CHelp._m_item_title = itemTitle ;
		
						var image_to_export = CFab.createToDataURL(CHelp._m_canvas , CHelp._m_current_scale , CHelp._m_item_title); //1 -> isToExport
					}
					else if(response == 0)
					{
						$('#errorDiv').show();
						$('#errorDiv').html('* Sorry,name '+itemTitle+' is unavailable<br/>Please try another');
					}
					
                });	
		
		}
	} ,
	
	
	validateSignUpForm : function(form , event)
	{
		event.preventDefault();
	
		var error = false ;
		
		var signUpObj = {
			username : form.username.value ,
			password : form.password.value ,
			password2 : form.password2.value ,
			email : form.email.value 
		}
		
		if( signUpObj.username.length == 0 || signUpObj.password.length == 0 || signUpObj.password2.length == 0 || signUpObj.email.length == 0)
		{
			error = true ;
			$('#signUpError').show();
			$('#signUpError').html('Required fields cannot be blank');
		}
		
		if(error != true)
		{
			$.post("/signup", signUpObj , function(response) {
				
				if( response.success && response.success.length > 0)
				{
					
					CHelp.userId = response.id ;
					CHelp.userName = signUpObj.username ;
					setTimeout( function(){
						$('#signUpError').show();
						$('#signUpError').html('<div style="color:#fff;">User has been created successfully</div>');
						CHtml.unBlockScreen(event);
						CHtml.showUserLoggedIn(CHelp.userName);
					
					} , 2000);
				}
				else
				{	
					$('#signUpError').show();
					$('#signUpError').html(response.error);
				}
				
			} , 'json');
		}
		
	},
	
	validateSignInForm : function( form , event )
	{
		event.preventDefault();
		
		var signInObj = {
				username : form.username.value ,
				password : form.password.value 
			};
			
		var error = false ;
		
		if( (signInObj.username.length == 0 && signInObj.password.length == 0) || (signInObj.username.length == 0 || signInObj.password.length == 0))
		{
			error = true ;
			$('#signInError').show();
			$('#signInError').html('Required fields cannot be blank');
		}
		
		if(error != true)
		{
			 $.post("/signin", signInObj , function(response) {
				
				if( response.success && response.success.length > 0)
				{
					$('#signInError').show();
					$('#signInError').html('<div style="color:#fff;">Logged in successfully</div>');
					CHelp.userId = response.id;
					CHelp.userName = signInObj.username ;
					setTimeout( function(){
						
						CHtml.unBlockScreen(event);
						CHtml.showUserLoggedIn(CHelp.userName);
						}, 2000);
				}
				else
				{
					$('#signInError').show();
					$('#signInError').html(response.error);	
				}
				
			},'json');
		}
		
	},
	
	sendContentToServer : function()
	{
		CHtml.blockScreen('<span class="monospaceFont">Saving please wait</span>');
		var canJSON = JSON.stringify(CHelp._m_canvas);
		
		var currentScale = CHelp._m_current_scale;

		var myJSONobj = { 
				title: CHelp._M_TITLE,
				fabric: canJSON 
		};
		
		$.post("/save_app/", myJSONobj , function(response) {
				
				if( response.success && response.success.length > 0)
				{
					CHtml.unBlockScreen();
					$.blockUI({ message: "<div class='validate'><div style='float:left;width:15%'><img src='/static/img/check.png' align=center/></div><div style='width:70%;float:left; padding-top: 2px;'>Saved successfully as <b>"+myJSONobj.title+"</b></div>" }); 
					
					setTimeout(function(){CHtml.unBlockScreen();} , 3000) ; // Show Saved successfully for 3 seconds
					
				}
				else if( response.error && response.error.length > 0)
				{
					CHtml.unBlockScreen(event);
					CHtml.showErrorNotification(response.error);	
				}
			
		} , 'json');
	 
	}
	
}