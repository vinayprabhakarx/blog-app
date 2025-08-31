import React, { createContext, useContext, useMemo, useState } from "react";

// Sidebar Context and Hook
const SidebarContext = createContext(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = React.memo(
  ({ children, open: openProp, setOpen: setOpenProp, animate = true }) => {
    const [openState, setOpenState] = useState(false);
    const open = openProp !== undefined ? openProp : openState;
    const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

    const contextValue = useMemo(
      () => ({
        open,
        setOpen,
        animate,
      }),
      [open, setOpen, animate]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        {children}
      </SidebarContext.Provider>
    );
  }
);

SidebarProvider.displayName = "SidebarProvider";
