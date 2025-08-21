import Cookies from "js-cookie";

export const getAccessToken = () => Cookies.get("access_token");