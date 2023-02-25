exports = {
  onTicketCreateHandler: function (args) {
    console.log("%%%%%%%%%%%%%%%%%%%%")
    const { id } = args.data.ticket;
    const { email } = args.data.requester;
    fetchTicketData(id, args.iparams, email);
  }
};
let fetchTicketData = async (id, iparams, email) => {
  try {
    let data = await $request.invokeTemplate("fetchTicketData", { context: { id } });
    let ticketResp = JSON.parse(data.response).ticket;
    console.log(ticketResp.custom_fields)
    if (Object.keys(ticketResp.custom_fields).includes(iparams.checkboxes) && ticketResp.custom_fields[iparams.checkboxes]) {
      formBodyForTicketCreation(ticketResp, email);
    }
  } catch (error) {
    console.log("@FETCH TICKET DATA")
    console.error(error);
  }
};
let formBodyForTicketCreation = async (ticketResp, email) => {
  let { subject, description, priority, id } = ticketResp;
  console.log(subject, description, priority, id)
  let body = {
    subject, description, priority, status: 2, email, mpay_priority: 'Medium'
  };
  console.log(JSON.stringify(body))
  try {
    let data = await $request.invokeTemplate("createTicket", { body: JSON.stringify(body) });
    console.log("CCCCCCCCCCCCCCCCCCCCCc")
    console.log(data.response)
  } catch (error) {
    console.log("@TICKET CREATION IN MP")
    console.error(error)
  }
};