module.exports = {
  name: "presenceUpdate",
  async execute(_, newPresence, client) {
    const guild = newPresence.guild;
    if (!guild) return;
  },
};
