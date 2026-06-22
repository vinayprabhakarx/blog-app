/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useMemo, useState } from "react";

// Sidebar Context
export const SidebarContext = createContext(undefined);

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
