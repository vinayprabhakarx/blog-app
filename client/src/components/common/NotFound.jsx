import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNotFoundContext } from "@/hooks/useNotFoundContext.jsx";

const NotFound = ({
  title,
  message,
  showBackButton = true,
  customMessage,
  errorCode = "404",
}) => {
  const navigate = useNavigate();
  const { content } = useNotFoundContext();

  const finalTitle = title || content.title;
  const finalMessage = customMessage || message || content.message;


  return (
    <section className="flex justify-center items-center py-20 px-6 bg-background" aria-label="Not Found Error">
      <div className="text-center max-w-2xl w-full space-y-8">
        {/* Error Code */}
        <div>
          <h2 className="text-4xl sm:text-5xl font-bold text-primary/20 select-none mb-4">
            {errorCode}
          </h2>
        </div>

        {/* Error Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          {finalTitle}
        </h1>

        {/* Error Message */}
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto mb-8">
          {finalMessage}
        </p>

        {/* Action Buttons */}
        {showBackButton && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              variant="default"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-6 py-2 text-sm w-full sm:w-auto min-w-[150px]"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default NotFound;
