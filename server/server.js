exports = {
  onTicketCreateHandler: (args) => {
    const { type_name } = args.data.ticket;
    console.log(type_name)
      (type_name === "Incident") ? console.log("Incident is created") : console.log("Service request is created")
  }

};
