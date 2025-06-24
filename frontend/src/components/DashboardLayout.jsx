import DashboardHeader from "./DashboardHeader";

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardHeader />
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
    </div>
  );
};

export default DashboardLayout;
