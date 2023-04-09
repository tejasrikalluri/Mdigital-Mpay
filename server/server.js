exports = {
  onConversationCreateCallback: function (payload) {
    console.log("Conversation create event hitted")
    const { source, body, ticket_id, incoming } = payload.data.conversation;
    console.log("incoming-> " + incoming)
    if (source === 2 && !incoming)
      createPrivateNoteInMP(body, ticket_id, payload.iparams);
  },
  onAppInstallCallback: function () {
    generateTargetUrl().then(function (url) {
      console.log(url)
      renderData();
    }, function (err) {
      console.log("@App install event")
      console.error(err)
      renderData(err);
    });
  }, onExternalEventHandler: function (payload) {
    console.log("External event hitted")
    console.log(payload)
    console.log(payload.data)
    const { ticket_id, ticket_status, ticket_requester_email } = payload.data.freshdesk_webhook;
    console.log(ticket_id, ticket_status, ticket_requester_email, " <-Ticket ID,status and email");
    if (!ticket_status && !ticket_requester_email) fetchTicketNotes(ticket_id.split("-")[1], payload);
    else if (ticket_requester_email) fetchTicketID(ticket_id.split("-")[1], payload.iparams);
    else
      createPrivateStatusSync(ticket_id.split("-")[1], payload.iparams, ticket_status);
  }
};
let fetchTicketID = (ticket_id, iparams) => {
  $db.get(`ticket_mondia:${ticket_id}`).then(function (data) {
    console.log(data.mondiaPay," <-mondia digital db linked ticket in mondia pay")
    console.log("ticket data available in DB")
  }, function (error) {
    if (error.status === 404) {
      fetchTicketData(ticket_id, iparams);
    } else {
      console.log("in fetchTicketID()")
      console.error(error)
    }
  });
}
let fetchTicketNotes = async (id, payload) => {
  try {
    let data = await $request.invokeTemplate("fetchTicketNotes", { context: { id } });
    let convData = JSON.parse(data.response).conversations[0];
    console.log(convData.incoming," <-Incoming")
    if ((convData.source === 2 || convData.source === 0) && !convData.incoming)
      createPrivateNoteSync(convData.source, convData.body, convData.ticket_id, payload.iparams);
  } catch (error) {
    console.log("@FETCH notes DATA")
    console.error(error);
  }
};
let fetchTicketData = async (id, iparams) => {
  try {
    let data = await $request.invokeTemplate("fetchTicketData", { context: { id } });
    let ticketResp = JSON.parse(data.response).ticket;
    console.log("Custom fields")
    console.log(ticketResp.custom_fields)
    if (Object.keys(ticketResp.custom_fields).includes(iparams.checkboxes) && ticketResp.custom_fields[iparams.checkboxes]) {
      formBodyForTicketCreation(ticketResp, iparams);
    }
  } catch (error) {
    console.log("@FETCH TICKET DATA")
    console.error(error);
  }
};
let createPrivateNoteInMP = async (body, ticket_id, iparams) => {
  let note_body = {
    incoming: true
  };
  note_body.body = "Note has been added by Mondia Digital: <br/>" + body;
  console.log(ticket_id," <-Ticket id which needs to fetch from db");
  $db.get(`ticket_mondia:${ticket_id}`).then(function (data) {
    console.log(data.mondiaPay, " <-mondia's linked ticket(mondia pay)")
    try {
      let dataP = $request.invokeTemplate("createPrivateNoteMP", { body: JSON.stringify(note_body), context: { id: data.mondiaPay, domain: iparams.domain_mp }, apiKey: iparams.apiKeyMp });
      if (dataP)
        console.info(`Private note has been created for ticket ${data.mondiaPay} in ${iparams.domain_mp}`);
    } catch (error) {
      console.log(`@createPrivateNoteInMP CREATION in ${iparams.domain_mp}`)
      console.error(error)
    }
  }, function (error) {
    console.log("In createPrivateNoteInMP() @db fetching")
    console.error(error)
  });
}
let createPrivateNoteSync = async (source, body, ticket_id, iparams) => {
  let note_body = {
    incoming: true
  };
  note_body.body = (source === 0) ? "Reply has been added by Mondia Pay: <br/>" + body : "Note has been added by Mondia Pay: <br/>" + body;
  console.log(ticket_id," <-ticket id which need to fetch from db")
  $db.get(`ticket_mp:${ticket_id}`).then(function (data) {
    console.log(data.mondia)
    try {
      let dataP = $request.invokeTemplate("createPrivateNote", { body: JSON.stringify(note_body), context: { id: data.mondia, domain: iparams.domain }, apiKey: iparams.api_key });
      if (dataP)
        console.info(`Private note has been created for ticket ${data.mondia} in ${iparams.domain}`);
    } catch (error) {
      console.log(`@createPrivateNoteSync CREATION in ${iparams.domain}`)
      console.error(error)
    }
  }, function (error) {
    console.log("in createPrivateNoteSync() @db fetching")
    console.error(error)
  });
};
let createPrivateStatusSync = async (ticket_id, iparams, status) => {
  let note_body = {
    incoming: true, body: `Linked ticket Status has been changed to '${status}' in Mondia Pay ticket: #${ticket_id}`
  };
  console.log(ticket_id," <-ticket id which need to fetch from db")
  $db.get(`ticket_mp:${ticket_id}`).then(function (data) {
    console.log(data.mondia," <-mondia pay linked ticket from mondia")
    try {
      let dataP = $request.invokeTemplate("createPrivateNote", { body: JSON.stringify(note_body), context: { id: data.mondia, domain: iparams.domain }, apiKey: iparams.api_key });
      if (dataP)
        console.info(`Private note has been created for ticket ${data.mondia} in ${iparams.domain}`);
    } catch (error) {
      console.log(`@createPrivateStatusSync CREATION in ${iparams.domain}`)
      console.error(error)
    }
  }, function (error) {
    console.log("in createPrivateStatusSync() @db fetching")
    console.error(error)
  });
};

let formBodyForTicketCreation = async (ticketResp, iparams) => {
  let { subject, description, priority, id } = ticketResp;
  let body = {
    subject, description, priority, status: 2, email: 'servicedesk@mondia.com', custom_fields: {
      "mpay_priority": "Low"
    }, type: "Incident"
  };
  console.log(body)
  console.log(id)
  try {
    let data = await $request.invokeTemplate("createTicket", { body: JSON.stringify(body) });
    if (data) {
      let mp_id = JSON.parse(data.response).ticket.id;
      console.info("Ticket created successfully in Mondia Pay")
      let ticketsArr = [{ id: mp_id, domain: iparams.domain_mp, apiKey: iparams.apiKeyMp }, { id, domain: iparams.domain, apiKey: iparams.api_key }];
      console.log("TICKETS ARRAY")
      console.log(ticketsArr)
      createPrivateNote(ticketsArr);
    }
  } catch (error) {
    console.log("@TICKET CREATION IN MP")
    console.error(error)
  }
};

let createPrivateNote = async (arr) => {
  let body = {
    incoming: true,
    body: `This ticket has been linked to Mondia Digital ticket #<a href="https://${arr[1].domain}/a/tickets/${arr[1].id}" target="_blank">${arr[1].id}</a>`
  };

  console.log(body)
  try {
    let data = await $request.invokeTemplate("createPrivateNoteMP", { body: JSON.stringify(body), context: { id: arr[0].id, domain: arr[0].domain }, apiKey: arr[0].apiKey });
    if (data) {
      console.info(`Private note has been created for ticket ${arr[0].id} in ${arr[0].domain}`)
    }
  } catch (error) {
    console.log(`@Note CREATION in ${arr[0].domain}`)
    console.error(error)
  }
  body.body = `This ticket has been linked to Mondia pay ticket #<a href="https://${arr[0].domain}/a/tickets/${arr[0].id}" target="_blank">${arr[0].id}</a>`
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
let linkTicket = (arr) => {
  $db.set(`ticket_mondia:${arr[1].id}`, { "mondiaPay": arr[0].id }).then(function () {
    console.info(`Succesfully linked ticket of ${arr[1].id} to ${arr[0].id}`)
    linkTicketMp(arr);
  }, function (error) {
    console.log(`@link CREATION`)
    console.error(error)
  });
}
let linkTicketMp = (arr) => {
  $db.set(`ticket_mp:${arr[0].id}`, { "mondia": arr[1].id }).then(function () {
    console.info(`Succesfully linked ticket of ${arr[0].id} to ${arr[1].id}`)
  }, function (error) {
    console.log(`@link linkTicketMp`)
    console.error(error)
  });
}