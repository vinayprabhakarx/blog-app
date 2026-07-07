import api from "@/api/api";

const API_URL = "/send-email"; // Route from backend

// Get all contacts (admin)
const getContacts = async (page = 1, limit = 10, search = "", status = "") => {
  let url = `${API_URL}?page=${page}&limit=${limit}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (status && status !== "all") url += `&status=${status}`;
  const response = await api.get(url);
  return response.data;
};

// Update contact status
const updateContactStatus = async (id, status) => {
  const response = await api.put(`${API_URL}/${id}/status`, { status });
  return response.data;
};

// Delete contact
const deleteContact = async (id) => {
  const response = await api.delete(`${API_URL}/${id}`);
  return response.data;
};

const contactService = {
  getContacts,
  updateContactStatus,
  deleteContact,
};

export default contactService;
