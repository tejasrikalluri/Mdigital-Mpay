exports = {
  onTicketCreateHandler: function (args) {
    console.log("Ticket create event hitted")
    const { id } = args.data.ticket;
    const { email } = args.data.requester;
    fetchTicketData(id, args.iparams, email);
  }, onConversationCreateCallback: function (payload) {
    const { source, body, ticket_id } = payload.data.conversation;
    if (source === 2 || source === 0)
      createPrivateNoteSync(source, body, ticket_id, payload.iparams);
  }
};
let fetchTicketData = async (id, iparams, email) => {
  try {
    let data = await $request.invokeTemplate("fetchTicketData", { context: { id } });
    let ticketResp = JSON.parse(data.response).ticket;
    console.log(ticketResp.custom_fields)
    if (Object.keys(ticketResp.custom_fields).includes(iparams.checkboxes) && ticketResp.custom_fields[iparams.checkboxes]) {
      formBodyForTicketCreation(ticketResp, email, iparams);
    }
  } catch (error) {
    console.log("@FETCH TICKET DATA")
    console.error(error);
  }
};
let createPrivateNoteSync = async (source, body, ticket_id, iparams) => {
  let note_body = {
    incoming: true
  };
  note_body.body = (source === 0) ? "Reply has been added to mondia digital <br/>" + body : "Note has been added to mondia digital" + body;
  try {
    let data = await $request.invokeTemplate("createPrivateNoteMP", { body: JSON.stringify(note_body), context: { id: ticket_id, domain: iparams.domain_mp }, apiKey: iparams.apiKeyMp });
    if (data) {
      console.info(`Private note has been created for ticket ${ticket_id} in ${arr[0].domain}`)
    }
  } catch (error) {
    console.log(`@Note CREATION in ${arr[0].domain}`)
    console.error(error)
  }
}
let formBodyForTicketCreation = async (ticketResp, email, iparams) => {
  let { subject, description, priority, id, type } = ticketResp;
  let body = {
    subject, description, priority, status: 2, email, custom_fields: {
      "mpay_priority": "Low"
    }, type
  };
  console.log(body)
  console.log(id)
  try {
    let data = await $request.invokeTemplate("createTicket", { body: JSON.stringify(body) });
    if (data) {
      let mp_id = JSON.parse(data.response).ticket.id;
      console.info("Ticket created successfully in mondia pay")
      let ticketsArr = [{ id: mp_id, domain: iparams.domain_mp, apiKey: iparams.apiKeyMp }, { id, domain: iparams.domain, apiKey: iparams.api_key }];
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
    body: `Test note please ignore`
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
  $db.set(arr[1].id, { "mondiaPay": arr[0].id }).then(function () {
    console.info(`Succesfully linked ticket of ${arr[1].id} to ${arr[0].id}`)
  }, function (error) {
    console.log(`@link CREATION`)
    console.error(error)
  });
}