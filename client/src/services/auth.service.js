import axios from "axios";
const configs = {
  development: {
    SERVER_URI: "http://localhost:8080/",
  },
  production: {
    SERVER_URI: "https://project9mern.herokuapp.com/",
  },
};
const API_URL = configs[process.env.NODE_ENV] + "/api/user";

class AuthService {
  login(email, password) {
    return axios.post(API_URL + "/login", { email, password });
  }
  logout() {
    localStorage.removeItem("user");
  }
  register(username, email, password, role) {
    return axios.post(API_URL + "/register", {
      username,
      email,
      password,
      role,
    });
  }
  getCurrentUser() {
    return JSON.parse(localStorage.getItem("user"));
  }
}

export default new AuthService();
