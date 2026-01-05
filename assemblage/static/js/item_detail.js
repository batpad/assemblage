$(function() {
    $('#changeImageForm').submit(function(e) {
        e.preventDefault();
        var size = $('#imageSize').val();
        var rotation = $('#imageRotation').val();
        var id = $('#itemId').val();
        var imgUrl = "/" + id + "/" + size + ".png?rotate=" + rotation;
        $('#submitForm').attr("disabled", "disabled").text("Loading...");
        $('#itemImage').attr("src", imgUrl);
        $('#itemImage').bind("load", function() {
            $('#submitForm').removeAttr("disabled").text("Update image");
            $('#itemImage').unbind("load");
        });

    });

    $('#submitForm').click(function() {
        $(this).parents('form').submit();
    });

    $('.range').change(function() {
        var value = $(this).val();
        $(this).next().text(value);
    });
    $('.range').change();
    $('#changeImageForm').submit();
});

//$('#searchList').select2({tags:["red", "green", "blue"]});
