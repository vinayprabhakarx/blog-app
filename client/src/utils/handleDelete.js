import { showToast } from "./showToast";
import api from "@/api/api";

export const deleteData = async (endpoint) => {
  const confirmed = confirm("Are you sure you want to delete this data?");
  if (!confirmed) return false;

  try {
    // Remove API base URL from endpoint for cleaner API call
    const endpointPath = endpoint.replace(api.defaults.baseURL, "");

    await api.delete(endpointPath);
    return true;
  } catch (error) {
    console.error("Delete failed:", error.message);
    showToast("error", error.message || "Failed to delete data");
    return false;
  }
};
