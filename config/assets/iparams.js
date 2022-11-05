app.initialized().then(function (client) {
    window.client = client;
    $(".sn_authentication,.custom_checkbox").hide();
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
        if ($("#apiKeymp").val().trim() === "") {
            $("#apiKeymp").attr("state-text", "Please enter Mondia Pay API key");
            $("#apiKeymp").attr("state", "error");
        } else {
            $("#apiKeymp").removeAttr("state-text");
            $("#apiKeymp").removeAttr("state");
        }
        if ($("#domain_mp").val().trim() === "") {
            $("#domain_mp").attr("state-text", "Please enter Mondia Pay domain");
            $("#domain_mp").attr("state", "error");
        } else {
            $("#domain_mp").removeAttr("state-text");
            $("#domain_mp").removeAttr("state");
        }
        if ($("#apiKeymp").val().trim() !== "" && $("#domain_mp").val().trim() !== "") {
            $("#authBtn_mp").text("Authenticating...");
            getTicketFieldsMp(client);
        } else buttonEnable("authBtn_mp");
    });
    $("#validateCheckox").click(checkBoxSelectValidation);
    $(document).on('fwFocus', '#domain,#apiKey,#apiKeymp,#domain_mp,#checkboxes', function () {
        iterateRemoveAttr(['domain', 'apiKey', 'domain_mp', 'apiKeymp', 'checkboxes'])
        $(".error_div,.error_div_mp").html("");
        buttonEnable("authBtn_mp"); buttonEnable("authBtn");
    });

}, function (error) {
    handleError(error, "error_div");
});
let checkBoxSelectValidation = () => {
    if (!$("#checkboxes").val()) {
        $("#checkboxes").attr("state-text", "Please choose checkbox field");
        $("#checkboxes").attr("state", "error");
    } else {
        $(".custom_checkbox").hide();
        $(".sn_authentication").show();
    }
};

let iterateRemoveAttr = (ids) => {
    ids.forEach(element => {
        $(`#${element}`).removeAttr("state-text");
        $(`#${element}`).removeAttr("state");
    });
}
function getTicketFields(client) {
    var domain = $("#domain").val();
    var api_key = $("#apiKey").val();
    var headers = { "Authorization": "Basic " + btoa(api_key) };
    var options = { headers: headers };
    var url = `https://${domain}/api/v2/ticket_form_fields`;
    client.request.get(url, options).then(function (data) {
        $("#authBtn").text("Authenticated");
        $(".authentication").hide();
        appendCheckboxes(data);
    }, function (error) {
        handleError(error, "error_div");
        buttonEnable("authBtn");
    });
}
let appendCheckboxes = (data) => {
    try {
        let ticket_fields = JSON.parse(data.response).ticket_fields;
        let custom_checkboxes = ticket_fields.filter(type => type.field_type === 'custom_checkbox');
        let checkboxSelectElement = `<fw-select id="checkboxes" placeholder="Choose custom checkbox" label="Choose checkbox in mondia digital" required="true">`;
        for (const key in custom_checkboxes) {
            checkboxSelectElement += `<fw-select-option value=${custom_checkboxes[key].id}>${custom_checkboxes[key].label}</fw-select-option>`;
        }
        checkboxSelectElement += '</fw-select>';
        $("#validateBtnDiv").prepend(checkboxSelectElement);
        $(".custom_checkbox").show();
    } catch (error) {
        console.log(error);
    }
}
function getTicketFieldsMp(client) {
    var domain = $("#domain_mp").val();
    var api_key = $("#apiKeymp").val();
    var headers = { "Authorization": "Basic " + btoa(api_key) };
    var options = { headers: headers };
    var url = `https://${domain}/api/v2/tickets?per_page=1&page=1`;
    client.request.get(url, options).then(function () {
        $(".custom_checkbox").hide();
        $(".sn_authentication").show();
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