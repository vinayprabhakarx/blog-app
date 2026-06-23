import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const AuthCard = ({ children, className, ...props }) => {
  return (
    <Card
      className={cn(
        "w-100 max-w-[95vw] p-5 sm:p-6 bg-background text-foreground shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
};

export default AuthCard;
