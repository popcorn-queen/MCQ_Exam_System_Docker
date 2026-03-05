import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function useAuthAxios() {
  const navigate = useNavigate();
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    // Redirect immediately if no token present
    if (!token) { navigate("/admin"); return; }

    // Intercept all axios responses — redirect on 401
    const interceptor = axios.interceptors.response.use(
      res => res,
      err => {
        if (err.response?.status === 401) {
          localStorage.removeItem("adminToken");
          navigate("/admin");
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [token, navigate]);

  return {
    headers: { Authorization: `Bearer ${token}` },
    logout: () => {
      localStorage.removeItem("adminToken");
      navigate("/admin");
    }
  };
}