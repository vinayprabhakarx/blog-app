import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";
import { useNotFoundContext } from "../../hooks/useNotFoundContext.jsx";

const NotFound = ({
  title,
  message,
  showBackButton = true,
  backPath,
  backText,
  customMessage,
  errorCode = "404",
  customIcon,
}) => {
  const navigate = useNavigate();
  const { content } = useNotFoundContext();

  const finalTitle = title || content.title;
  const finalMessage = customMessage || message || content.message;
  const finalBackPath = backPath || content.primaryAction.path;
  const finalBackText = backText || content.primaryAction.text;
  const PrimaryIcon = content.primaryAction.icon;
  const contextualContent = {
    ...content,
    title: finalTitle,
    message: finalMessage,
  };

  return (
    <div className="flex justify-center items-center py-20 px-6 bg-background">
      <div className="text-center max-w-2xl w-full space-y-8">
        {/* Error Code */}
        <div>
          <h2 className="text-8xl sm:text-9xl font-bold text-primary/20 select-none">
            {errorCode}
          </h2>
        </div>

        {/* Error Icon */}
        <div className="flex items-center justify-center text-5xl text-muted-foreground">
          {customIcon || contextualContent.errorIcon}
        </div>

        {/* Error Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
          {finalTitle}
        </h1>

        {/* Error Message */}
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md mx-auto">
          {finalMessage}
        </p>

        {/* Action Buttons */}
        {showBackButton && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to={finalBackPath}>
              <Button 
                size="lg"
                className="flex items-center gap-2 px-6 py-3 text-base w-full sm:w-auto min-w-[200px]"
              >
                <PrimaryIcon className="w-5 h-5" />
                {finalBackText}
              </Button>
            </Link>

            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-6 py-3 text-base w-full sm:w-auto min-w-[200px]"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotFound;
