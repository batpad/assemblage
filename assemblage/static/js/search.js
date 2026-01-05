var blockUICSS = {
     'top': '20%',
     'border-radius': '6px',
     'border-style': 'double',
     'border-width': '3px',
     'border-color': '#aaa'
}

$(document).ready(function(){
    $('#searchLink').click(function() { 
            $.blockUI({ message: $('#searchAdvanced'), css: blockUICSS });
            /*
            $('.blockOverlay').css({
               'cursor': 'auto'
            });
            
            $(".blockOverlay").click(function(e) {
                $.unblockUI();
                $('.blockOverlay').unbind("click");
            });
            */
    });
    $(document).delegate(".blockOverlay", "click", function(e) {
        $.unblockUI();
    });

    $('#objectType').change(function() {
        resetSearch();
        CItem.fetchItems(getNormalSearchParams());
    });

    $('#searchList').change(function() {
        resetSearch();
        CItem.fetchItems(getNormalSearchParams());
    });

    $('#submitAdvanced').click(function(e) {
        e.preventDefault();
        resetSearch();
        CItem.fetchItems(getAdvancedSearchParams());
        $.unblockUI();
    });

    $('#listView').scroll(function() {
        var $this = $(this);
        var height = $this.prop('scrollHeight');
        var parentHeight = $('#listSearchBlock').height();
        var scrollTop = $this.scrollTop();
        //var isNearBottom = (height - scrollTop) < 150 ? true : false;
        var isNearBottom = (height - scrollTop) - (parentHeight - 80) < 40 ? true : false;
        var searching = false;
        var currPage = parseInt($('#page').val());
        if (isNearBottom && !searching && currPage < CItem.totalPages) {
            currPage += 1;
            $('#page').val(currPage);
            searching = true;
            CItem.fetchItems(getAdvancedSearchParams(), function() {
                searching = false;
            });        
        }
    });

    $('#searchList').select2({
        'placeholder': 'Search by tag',
        'allowClear': true
    });
    //$('.signupLink').click(function() { 
      //      $.blockUI({ message: $('#searchAdvanced'), css: { width: '320px', top: '20%' } });
   
});

function resetSearch() {
    var $listView = $('#listView');
    $listView.empty();
    var $loadingDiv = $('<div />').addClass("loadingDiv").text("Loading...").appendTo($listView);
    $('#page').val('1');
}

function getAdvancedSearchParams() {
    var params = getNormalSearchParams();
    var q = $('#q').val();
    if (q) params['q'] = q;
    var q_field = $('#q_field').val();
    if (q_field) params['q_field'] = q_field;
    var city = $('#city').val();
    if (city) params['city'] = city;
    var market = $('#market').val();
    if (market) params['market'] = market;
    params['sort'] = $('#sort').val();
    return params;    
}

function getNormalSearchParams() {
    var params = {};
    var objectType = $('#objectType').val();
    if (objectType) {
        if (objectType == 'mine') {
            params['user'] = USER_ID;
        } else {
            params['type'] = objectType;
        }
    }
    //var tag = $('#searchList').val() && $('#searchList').val() != 'Tag';
    var tag = $('#searchList').val();
    if (tag) {
        params['tag'] = tag;
    }
    var page = $('#page').val();
    if (page) { 
        params['page'] = page;
    }
    return params;
}


