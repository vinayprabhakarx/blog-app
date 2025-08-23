import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";
import { useNotFoundContext } from "../../hooks/useNotFoundContext";

const NotFound = ({
  title,
  message,
  showBackButton = true,
  backPath,
  backText,
  customMessage,
  errorCode = "404",
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
    <div className="flex justify-center items-center min-h-screen p-6 bg-background">
      <div className="text-center max-w-2xl w-full">
        {/* Error Icon */}
        <div className="flex items-center justify-center text-6xl mb-4">
          {contextualContent.errorIcon}
        </div>

        {/* Error Code */}
        <div className="flex items-center justify-center text-5xl font-bold text-destructive mb-2.5">
          {errorCode}
        </div>

        {/* Error Title */}
        <h1 className="text-3xl font-semibold mb-3 text-foreground">
          {finalTitle}
        </h1>
        <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
          {finalMessage}
        </p>

        {/* Primary Action */}
        {showBackButton && (
          <div className="flex flex-col items-center gap-4 mb-8">
            <Link to={finalBackPath}>
              <Button className="flex items-center gap-2 px-6 py-3 text-base">
                <PrimaryIcon className="w-5 h-5" />
                {finalBackText}
              </Button>
            </Link>

            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
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
