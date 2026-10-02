export const getAuditLogs = async (_req, res) => {
  try {
    res.json({ logs: [] });
  } catch (error) {
    res.status(500).json({ message: "Unable to load audit logs right now." });
  }
};
