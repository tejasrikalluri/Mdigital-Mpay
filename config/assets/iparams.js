app.initialized().then(function (client) {
    window.client = client;
    $(".sn_authentication,.custom_checkbox,.custom_checkbox_mp").hide();
    $(document).on('click', '#authBtn', function () {
        $("#authBtn").prop("disabled", true);
        if ($("#apiKey").val().trim() === "") {
            $("#apiKey").attr("error-text", "Please enter Mondia Digital API key");
            $("#apiKey").attr("state", "error");
        } else {
            $("#apiKey").removeAttr("error-text");
            $("#apiKey").removeAttr("state");
        }
        if ($("#domain").val().trim() === "") {
            $("#domain").attr("error-text", "Please enter Mondia Digital domain");
            $("#domain").attr("state", "error");
        } else {
            $("#domain").removeAttr("error-text");
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
            $("#apiKeymp").attr("error-text", "Please enter Mondia Pay API key");
            $("#apiKeymp").attr("state", "error");
        } else {
            $("#apiKeymp").removeAttr("error-text");
            $("#apiKeymp").removeAttr("state");
        }
        if ($("#domain_mp").val().trim() === "") {
            $("#domain_mp").attr("error-text", "Please enter Mondia Pay domain");
            $("#domain_mp").attr("state", "error");
        } else {
            $("#domain_mp").removeAttr("error-text");
            $("#domain_mp").removeAttr("state");
        }
        if ($("#apiKeymp").val().trim() !== "" && $("#domain_mp").val().trim() !== "") {
            $("#authBtn_mp").text("Authenticating...");
        $(".error_div_mp").html("");

            getTicketFieldsMp(client);
        } else buttonEnable("authBtn_mp");
    });
    $("#validateCheckox").click(checkBoxSelectValidation);
    $("#validateCheckoxMp").click(checkBoxSelectValidationMp);
    $(document).on('fwFocus', '#domain,#apiKey,#apiKeymp,#domain_mp,#checkboxes,#checkboxesMp', function () {
        iterateRemoveAttr(['domain', 'apiKey', 'domain_mp', 'apiKeymp', 'checkboxes', 'checkboxesMp'])
        $(".error_div,.error_div_mp,.error_div_cc,.error_cc_mp").html("");
        buttonEnable("authBtn_mp"); buttonEnable("authBtn");
    });

}, function (error) {
    handleError(error, "error_div");
});
let checkBoxSelectValidation = () => {
    $('.error_div_cc').html('');
    if (!$("#checkboxes").val()) {
        $("#checkboxes").attr("error-text", "Please choose checkbox field");
        $("#checkboxes").attr("state", "error");
    } else {
        checkboxes = $("#checkboxes").val();
        console.log(checkboxes)
        $(".custom_checkbox").hide();
        $(".sn_authentication").show();
    }
};
let checkBoxSelectValidationMp = () => {
    $('.error_cc_mp').html('');
    if (!$("#checkboxesMp").val()) {
        $("#checkboxesMp").attr("error-text", "Please choose checkbox field");
        $("#checkboxesMp").attr("state", "error");
    } else
        $('#validateCheckoxMp').prop("disabled", true).text('Validated');
    console.log(checkboxes)
};

let iterateRemoveAttr = (ids) => {
    ids.forEach(element => {
        $(`#${element}`).removeAttr("error-text");
        $(`#${element}`).removeAttr("state");
    });
}
function to(promise, improved) {
    return promise
        .then((data) => [null, data])
        .catch((err) => {
            if (improved) {
                Object.assign(err, improved);
            }
            return [err];
        });
}
async function getTicketFields(client) {
    var domain = $("#domain").val();
    var api_key = $("#apiKey").val();
    let err, reply;
    [err, reply] = await to(client.request.invokeTemplate("fetchTicketFormFields", { "context": { domain, api_key } }));
    console.log(err);
    if (err) {
        handleError(err, "error_div");
        buttonEnable("authBtn");
    }
    if (reply) {
        $("#authBtn").text("Authenticated");
        $(".authentication").hide();
        appendCheckboxes(reply, "md");
    }
}
let appendCheckboxes = (data, origin) => {
    console.log(origin)
    try {
        let ticket_fields = JSON.parse(data.response).ticket_fields;
        let custom_checkboxes = ticket_fields.filter(type => type.field_type === 'custom_checkbox');
        if (origin === "md") {
            let checkboxSelectElement = `<fw-select class="fw-mb-8" id="checkboxes" placeholder="Choose custom checkbox" label="Choose checkbox in mondia digital" required="true">`;
            for (const key in custom_checkboxes) {
                checkboxSelectElement += `<fw-select-option value=${custom_checkboxes[key].name}>${custom_checkboxes[key].label}</fw-select-option>`;
            }
            checkboxSelectElement += '</fw-select>';
            $("#validateBtnDiv").prepend(checkboxSelectElement);
            $(".custom_checkbox").show();
        }
        /* else {
            let checkboxSelectElement = `<fw-select id="checkboxesMp" class="fw-mb-8" placeholder="Choose custom checkbox" label="Choose checkbox in mondia pay" required="true">`;
            for (const key in custom_checkboxes) {
                console.log(custom_checkboxes[key])
                checkboxSelectElement += `<fw-select-option value=${custom_checkboxes[key].name}>${custom_checkboxes[key].label}</fw-select-option>`;
            }
            checkboxSelectElement += '</fw-select>';
            $("#validateBtnMp").prepend(checkboxSelectElement);
            $(".custom_checkbox_mp").show();
        } */
        if (updatedConfigs) {
            $("#checkboxes").val(updatedConfigs.checkboxes);
            // $("#checkboxesMp").val(updatedConfigs.checkboxesMp);
        }
    } catch (error) {
        console.log(error);
    }
}
async function getTicketFieldsMp(client) {
    var domain = $("#domain_mp").val();
    var api_key = $("#apiKeymp").val();
    let err, reply;
    [err, reply] = await to(client.request.invokeTemplate("fetchTicketFormFields", { "context": { domain, api_key } }));
    console.log(err);
    if (err) {
        handleError(err, "error_div_mp");
        buttonEnable("authBtn_mp");
    }
    if (reply)
        $("#authBtn_mp").text("Authenticated");
    // $(".custom_checkbox_mp").show();
    /* $(".sn_authentication").hide();
    appendCheckboxes(reply, "mp"); */
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