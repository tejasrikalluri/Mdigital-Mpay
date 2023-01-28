exports = {
  onTicketCreateHandler: function (args) {
    console.log("%%%%%%%%%%%%%%%%%%%%")
    const { id } = args.data.ticket;
    fetchTicketData(id, args.iparams);
  }
};
let fetchTicketData = async (id, iparams) => {
  let err, reply;
  [err, reply] = await to($request.invokeTemplate("fetchTicketData", { "context": { id } }));
  console.log(reply);
  if (err) {
    console.log("@FETCH TICKET DATA")
    console.log(err);
  }
  try {
    let ticketResp = JSON.parse(reply.response).ticket;
    const custom_fields = Object.keys(ticketResp.custom_fields).filter((key) => key.includes(iparams.checkboxes)).reduce((obj, key) => {
      return Object.assign(obj, {
        [key]: ticketResp.custom_fields[key]
      });
    }, {});
    if (custom_fields[iparams.checkboxes]) formBodyForTicketCreation(ticketResp);
  } catch (error) {
    console.log("@CATCH FETCH TICKET DATA")
    console.log(error)
  }
};
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
let formBodyForTicketCreation = async (ticketResp) => {
  let { subject, description, priority, id } = ticketResp;
  console.log(subject, description, priority, id)
  let body = {
    subject, description, priority, status: 2
  };
  console.log(body)
  let err, reply;
  [err, reply] = await to($request.invokeTemplate("createTicket", { body: JSON.stringify(body) }));
  console.log(reply);
  if (err) {
    console.log("@TICKET CREATION IN MP")
    console.log(err)
  }
};