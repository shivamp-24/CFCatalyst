import useAuth from "../hooks/useAuth";

const DashboardPage = () => {
  const { user, logout } = useAuth();
  return (
    <div>
      <h1>Dashboard</h1>
      {user && <h2>Welcome {user.codeforcesHandle}</h2>}
      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default DashboardPage;
