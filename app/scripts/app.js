document.onreadystatechange = function () {
  if (document.readyState === 'interactive') renderApp();

  function renderApp() {
    var onInit = app.initialized();
    onInit.then(function getClient(_client) {
      window.client = _client;
      client.iparams.get("checkboxes").then(function (data) {
        window.checkboxes = data.checkboxes;
      }, function (error) {
        console.log("in iparams checkboxes data()")
        console.log(error);
        showNotification(error);
      });
      renderAppPlaceholder();
    }).catch(handleErr);
  }
};

function renderAppPlaceholder() {
  console.log("initialized...............")
  client.instance.context().then(function (context) {
    context.location === 'new_ticket_background' ? client.interface.trigger("hideElement", { id: checkboxes }) : fetchTicketDetails();
  });
}
let fetchTicketDetails = () => {
  client.data.get("ticket").then(function (data) {
    console.log(data.ticket)
    const { display_id } = data.ticket;
    console.log(display_id)
    var propertyChangeCallback = function (event) {
      console.log(event.type + " event occurred");
      var event_data = event.helper.getData();
      if (event_data[checkboxes] && event_data[checkboxes].value === "false") { fetchTicketID(display_id); }
    };
    client.events.on("ticket.propertiesUpdated", propertyChangeCallback);
  }, function (error) {
    console.log("in ticket data()")
    console.log(error)
    showNotification(error);
  });
}

let fetchTicketID = (ticket_id) => {
  client.db.get(`ticket_mondia:${ticket_id}`).then(function (data) {
    console.log(data.mondiaPay)
    const { mondiaPay } = data;
    client.iparams.get().then(function (iparams) {
      console.log(iparams)
      let ticketsArr = [{ id: mondiaPay, domain: iparams.domain_mp, apiKey: iparams.apiKeyMp }, { id: ticket_id, domain: iparams.domain, apiKey: iparams.api_key }];
      createPrivateNote(ticketsArr);
    }, function (error) {
      console.log("in iparams()")
      console.log(error);
      showNotification(error);
    });
  }, function (error) {
    console.log("in fetchTicketID()")
    console.error(error)
    showNotification(error);
  });
}
let createPrivateNote = async (arr) => {
  let body = {
    incoming: true,
    body: `This ticket has been unlinked from Mondia pay ticket #${arr[0].id}`
  };
  console.log(body)
  try {
    let data = await client.request.invokeTemplate("createPrivateNote", { body: JSON.stringify(body), context: { id: arr[1].id, domain: arr[1].domain }, apiKey: arr[1].apiKey });
    if (data) {
      console.info(`Private note has been created for ticket ${arr[1].id} in ${arr[1].domain}`)
      unlinkTicket(arr);
    }
  } catch (error) {
    console.log(`@Note CREATION in ${arr[1].domain}`)
    console.error(error)
    showNotification(error);
  }
}
function handleErr(err = 'None') {
  console.error(`Error occured. Details:`, err);
}
let unlinkTicket = (arr) => {
  client.db.delete(`ticket_mondia:${arr[1].id}`).then(function () {
    console.info(`Succesfully unlinked ticket of ${arr[1].id} to ${arr[0].id}`)
    unlinkTicketMp(arr);
  }, function (error) {
    console.log(`@unlink CREATION`)
    console.error(error)
    showNotification(error);
  });
}
let unlinkTicketMp = (arr) => {
  client.db.delete(`ticket_mp:${arr[0].id}`).then(function () {
    console.info(`Succesfully unlinked ticket of ${arr[0].id} to ${arr[1].id}`)
  }, function (error) {
    console.log(`@link unlinkTicketMp`)
    console.error(error)
    showNotification(error);
  });
}

let showNotification = (message) => {
  client.interface.trigger("showNotify", {
    type: "error", message
  });
}
