export const adminLogout = () => {
  localStorage.removeItem("adminToken");
  window.location.href = "/admin/login";
};
