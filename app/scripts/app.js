document.onreadystatechange = function () {
  if (document.readyState === 'interactive') renderApp();

  function renderApp() {
    var onInit = app.initialized();
    onInit.then(function getClient(_client) {
      window.client = _client;
      client.iparams.get("checkboxes").then(function (data) {
        window.checkboxes = data.checkboxes;
      }, function (error) {
        console.log(error);
      });
      renderAppPlaceholder();
    }).catch(handleErr);
  }
};

function renderAppPlaceholder() {
  console.log("initialized...............")
  client.instance.context().then(function (context) {
    if (context.location === 'new_ticket_background') {
      client.interface.trigger("hideElement", { id: checkboxes });
    }
  });
  fetchTicketDetails();
}
let fetchTicketDetails = () => {
  client.data.get("ticket").then(function (data) {
    let checkboxVal;
    console.log(data.ticket)
    const { custom_field, id } = data.ticket;
    for (let key in custom_field) {
      if (key.indexOf(checkboxes) > -1) {
        checkboxVal = custom_field[key];
      }
    }
    var propertyChangeCallback = function (event) {
      console.log(event.type + " event occurred");
      var event_data = event.helper.getData();
      if (event_data[checkboxes] && event_data[checkboxes].value === "false")
        fetchTicketID(id);
    };
    client.events.on("ticket.propertiesUpdated", propertyChangeCallback);
  }, function (error) {
    console.log(error)
  });
}

let fetchTicketID = (ticket_id) => {
  $db.delete(`ticket_mondia:${ticket_id}`).then(function () {
    console.log("Ticket deteled succcessfully in DB")
    let ticketsArr = [{ id: mp_id, domain: iparams.domain_mp, apiKey: iparams.apiKeyMp }, { id, domain: iparams.domain, apiKey: iparams.api_key }];
    createPrivateNote();
  }, function (error) {
    console.log(error)
  });
}
let createPrivateNote = async (arr) => {
  let body = {
    incoming: true,
    body: `This ticket has been unlinked from Mondia pay ticket #${arr[0].id}`
  };
  console.log(body)
  try {
    let data = await $request.invokeTemplate("createPrivateNote", { body: JSON.stringify(body), context: { id: arr[1].id, domain: arr[1].domain }, apiKey: arr[1].apiKey });
    if (data) {
      console.info(`Private note has been created for ticket ${arr[1].id} in ${arr[1].domain}`)
      linkTicket(arr);
    }
  } catch (error) {
    console.log(`@Note CREATION in ${arr[1].domain}`)
    console.error(error)
  }
}
function handleErr(err = 'None') {
  console.error(`Error occured. Details:`, err);
}
