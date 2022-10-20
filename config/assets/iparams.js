app.initialized().then(function (client) {
    window.client = client;
    $(".sn_authentication").hide();
    $(document).on('click', '#authBtn', function () {
        $("#authBtn").prop("disabled", true);
        if ($("#apiKey").val().trim() === "") {
            $("#apiKey").attr("state-text", "Please enter Mondia Digital API key");
            $("#apiKey").attr("state", "error");
        } else {
            $("#apiKey").removeAttr("state-text");
            $("#apiKey").removeAttr("state");
        }
        if ($("#domain").val().trim() === "") {
            $("#domain").attr("state-text", "Please enter Mondia Digital domain");
            $("#domain").attr("state", "error");
        } else {
            $("#domain").removeAttr("state-text");
            $("#domain").removeAttr("state");
        }
        if ($("#apiKey").val().trim() !== "" && $("#domain").val().trim() !== "") {
            $("#authBtn").text("Authenticating...");
            getTicketFields(client);
        } else buttonEnable("authBtn");
    });
    $(document).on('click', '#authBtn_mp', function () {
        $("#authBtn_mp").prop("disabled", true);
        if ($("#apiKeysn").val().trim() === "") {
            $("#apiKeysn").attr("state-text", "Please enter Mondia Digital API key");
            $("#apiKeysn").attr("state", "error");
        } else {
            $("#apiKeysn").removeAttr("state-text");
            $("#apiKeysn").removeAttr("state");
        }
        if ($("#domain_mp").val().trim() === "") {
            $("#domain_mp").attr("state-text", "Please enter Servicenow Username");
            $("#domain_mp").attr("state", "error");
        } else {
            $("#domain_mp").removeAttr("state-text");
            $("#domain_mp").removeAttr("state");
        }
        if ($("#apiKeysn").val().trim() !== "" && $("#domain_mp").val().trim() !== "") {
            $("#authBtn_mp").text("Authenticating...");
            getTicketFieldsMp(client);
        } else buttonEnable("authBtn_mp");
    });
    $(document).on('fwFocus', '#domain,#apiKey,#apiKeysn,#domain_mp', function () {
        $("#domain").removeAttr("state-text");
        $("#domain").removeAttr("state");
        $("#apiKey").removeAttr("state-text");
        $("#apiKey").removeAttr("state");
        $("#domain_mp").removeAttr("state-text");
        $("#domain_mp").removeAttr("state");
        $("#apiKeysn").removeAttr("state-text");
        $("#apiKeysn").removeAttr("state");
        $(".error_div,.error_div_mp").html("");
        buttonEnable("authBtn_mp");buttonEnable("authBtn");
    });

}, function (error) {
    handleError(error, "error_div");
});
function getTicketFields(client) {
    var domain = $("#domain").val();
    var api_key = $("#apiKey").val();
    var headers = { "Authorization": "Basic " + btoa(api_key) };
    var options = { headers: headers };
    var url = `https://${domain}/api/v2/tickets?per_page=1&page=1`;
    client.request.get(url, options).then(function () {
        $("#authBtn").text("Authenticated");
        $(".authentication").hide();
        $(".sn_authentication").show();
    }, function (error) {
        handleError(error, "error_div");
        buttonEnable("authBtn");
    });
}
function getTicketFieldsMp(client) {
    var domain = $("#domain_mp").val();
    var api_key = $("#apiKeysn").val();
    var headers = { "Authorization": "Basic " + btoa(domain + ":" + api_key) };
    var options = { headers: headers };
    var url = `https://alternativestaging.service-now.com/api/now/table/u_freshservice_ticket`;
    client.request.get(url, options).then(function () {
        $("#authBtn_mp").text("Authenticated");
    }, function (error) {
        handleError(error, "error_div_mp");
        buttonEnable("authBtn_mp");
    });
}
function buttonEnable(btnId) {
    $("#" + btnId).text("Authenticate");
    $("#" + btnId).prop("disabled", false);
}

function handleError(error, errorid) {
    console.log(error)
    $('.' + errorid).show();
    if (error.status === 400) {
        $('.' + errorid).html("Invalid Input entered, please verify the fields and try again.");
    } else if (error.status === 401 || error.status === 403) {
        $('.' + errorid).html("Invalid Credentials were given or Subscription to the service expired.");
    } else if (error.status === 404) {
        $('.' + errorid).html("Invalid Domain entered, please check the field and try again");
    } else if (error.status === 500) {
        $('.' + errorid).html("Unexpected error occurred, please try after sometime.");
    } else if (error.status === 502) {
        $('.' + errorid).html("Error in establishing a connection.");
    } else if (error.status === 504) {
        $('.' + errorid).html("Timeout error while processing the request.");
    } else {
        $('.' + errorid).html("Unexpected Error");
    }
}