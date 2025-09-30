const updateOnline = require("../online");

module.exports = {
  name: "presenceUpdate",
  async execute(_, newPresence, client) {
    const guild = newPresence.guild;
    if (!guild) return;
    await updateOnline(guild);
  },
};
