import React, { useState, createContext, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';

const AdminLayoutContext = createContext(null);

export const useAdminLayout = () => useContext(AdminLayoutContext);

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AdminLayoutContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar: () => setSidebarOpen((prev) => !prev),
        closeSidebar: () => setSidebarOpen(false)
      }}
    >
      <div className="min-h-screen bg-[#F8FAFC] flex overflow-x-hidden">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Outlet />
        </div>
      </div>
    </AdminLayoutContext.Provider>
  );
};

export default AdminLayout;

