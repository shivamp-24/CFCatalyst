// A simple custom hook to make using the AuthContext cleaner.

import { useContext } from "react";
import AuthContext from "../context/AuthContext";

const useAuth = () => {
  return useContext(AuthContext);
};

export default useAuth;
