// frontend/src/services/api.js
const BASE = (import.meta.env.VITE_API_URL) || "http://localhost:4000/api";

const headers = (token) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const request = async (method, path, body, token) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`${BASE}${path}`, {
      method, headers: headers(token), signal: controller.signal,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    clearTimeout(timeout);
    let data;
    try { data = await res.json(); } catch { throw new Error("Server returned invalid response"); }
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  } catch (err) {
    if (err.name === "AbortError") throw new Error("Request timed out — is the backend running?");
    if (err.name === "TypeError" && err.message === "Failed to fetch")
      throw new Error("Backend not reachable at " + BASE + " — run: cd backend && node server.js");
    throw err;
  }
};

// Auth
export const registerUser  = (body)        => request("POST", "/auth/register",    body);
export const loginUser     = (body)        => request("POST", "/auth/login",        body);
export const loginAdmin    = (body)        => request("POST", "/auth/admin-login",  body);

// Claims
export const submitClaim       = (body, token) => request("POST",  "/claims",              body, token);
export const getApprovedClaims = ()             => request("GET",   "/claims/approved");
export const getPendingClaims  = (token)        => request("GET",   "/claims/pending",      null, token);
export const getAllClaims       = (token)        => request("GET",   "/claims",              null, token);
export const getMyClaims       = (uid, token)   => request("GET",   `/claims/user/${uid}`,  null, token);
export const getClaimById      = (id, token)    => request("GET",   `/claims/${id}`,        null, token);
export const updateClaimStatus = (id, status, token) => request("PATCH", `/claims/${id}/status`, { status }, token);
export const deleteClaim       = (id, token)    => request("DELETE", `/claims/${id}`,       null, token);

// Donations
export const submitDonation  = (body, token)  => request("POST",  "/donations",                body, token);
export const getMyDonations  = (uid, token)   => request("GET",   `/donations/donor/${uid}`,   null, token);
export const getAllDonations  = (token)        => request("GET",   "/donations",                null, token);
export const getDonationStats= (token)        => request("GET",   "/donations/stats",          null, token);
export const verifyDonation  = (id, token)    => request("PATCH", `/donations/${id}/verify`,   null, token);
export const rejectDonation  = (id, token)    => request("PATCH", `/donations/${id}/reject`,   null, token);
export const deleteDonation  = (id, token)    => request("DELETE",`/donations/${id}`,          null, token);

// Messages
export const sendMessage        = (body, token) => request("POST",   "/messages",           body, token);
export const getAllMessages      = (token)       => request("GET",    "/messages",           null, token);
export const getClaimerMessages = (token)       => request("GET",    "/messages/claimers",  null, token);
export const getDonorMessages   = (token)       => request("GET",    "/messages/donors",    null, token);
export const deleteMessage      = (id, token)   => request("DELETE", `/messages/${id}`,     null, token);

// Admin
export const getAllUsers        = (token)        => request("GET",    "/admin/users",        null, token);
export const deleteUser        = (id, token)    => request("DELETE", `/admin/users/${id}`,  null, token);
export const getSystemStats    = (token)        => request("GET",    "/admin/stats",        null, token);
export const getDepartments    = (token)        => request("GET",    "/admin/departments",  null, token);
export const addDepartment     = (body, token)  => request("POST",   "/admin/departments",  body, token);
export const updateDepartment  = (id, b, token) => request("PUT",    `/admin/departments/${id}`, b, token);
export const deleteDepartment  = (id, token)    => request("DELETE", `/admin/departments/${id}`, null, token);

// Payment Info (public read, admin write)
export const getPaymentInfo    = ()             => request("GET",  "/payment-info");
export const savePaymentInfo   = (body, token)  => request("POST", "/admin/payment-info", body, token);
