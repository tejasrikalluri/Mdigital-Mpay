exports = {
  onTicketCreateHandler: (args) => {
    const { type_name, id } = args.data.ticket;
    console.log(type_name);
    // (type_name === "Incident") ? console.log("Incident is created") : console.log("Service request is created")
    console.log(args.iparams)
    fetchTicketData(id);
  }

};
let fetchTicketData = (id) => {
  var headers = { "Authorization": "Basic <%= encode(iparam.api_key) %>" };
  var options = { headers: headers };
  var url = "https://<%= iparam.domain %>/api/v2/tickets/" + id;
  $request.get(url, options).then(data => {
    console.log(data)
    try {
      let ticketResp = JSON.parse(data.response).ticket;
      console.log(ticketResp.custom_fields)
    } catch (error) {

    }
  }, error => {
    console.log("@FETCH TICKET DATA")
    console.log(error)
    console.log(url)
  });
}