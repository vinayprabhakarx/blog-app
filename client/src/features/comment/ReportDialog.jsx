import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reportComment, selectCommentsError } from "./commentsSlice";
import { showToast } from "@/utils/showToast";

const ReportDialog = ({
  open,
  onClose,
  commentId,
  commentAuthor = "this comment",
  hasReported = false,
}) => {
  const dispatch = useDispatch();
  const error = useSelector((state) => selectCommentsError(state, commentId));

  const [selectedReason, setSelectedReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportReasons = [
    { id: "spam", label: "Spam or promotional content" },
    { id: "hate_speech", label: "Hate speech or offensive language" },
    { id: "harassment", label: "Personal attacks or harassment" },
    { id: "misinformation", label: "Incorrect information" },
    { id: "irrelevant", label: "Off-topic or irrelevant to discussion" },
    { id: "inappropriate", label: "Inappropriate or explicit content" },
  ];

  const handleSubmit = async () => {
    if (!selectedReason) return;
    setIsSubmitting(true);
    try {
      await dispatch(
        reportComment({
          commentId,
          reason: selectedReason,
        })
      ).unwrap();
      showToast(
        "success",
        "Comment reported successfully. Our moderation team will review it."
      );
      onClose();
      // Reset form
      setSelectedReason("");
    } catch (error) {
      console.error("Failed to report comment:", error);
      showToast("error", "Failed to report comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedReason("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md px-4 sm:px-6 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg">
            Report Comment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {hasReported ? (
            <div
              className="p-3 bg-info/5 border border-info/20 rounded-lg"
              role="status"
              aria-live="polite"
            >
              <p className="text-sm text-info">
                You have already reported this comment. Our moderation team will
                review it.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are reporting a comment by{" "}
              <span className="font-medium text-foreground">
                {commentAuthor}
              </span>
              . Reporting helps us maintain a respectful community. Please
              select a reason below:
            </p>
          )}

          {!hasReported && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="report-reason"
                  className="text-sm font-medium text-foreground"
                >
                  Reason for reporting
                </label>
                <Select
                  value={selectedReason}
                  onValueChange={setSelectedReason}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    id="report-reason"
                    className="w-full cursor-pointer"
                    aria-describedby="report-help"
                  >
                    <SelectValue placeholder="Select a reason for reporting" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportReasons.map((reason) => (
                      <SelectItem
                        key={reason.id}
                        value={reason.id}
                        className="cursor-pointer"
                      >
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p id="report-help" className="text-xs text-muted-foreground">
                  Your report is anonymous. Our moderation team will review this
                  comment and take appropriate action.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            onClick={handleClose}
            variant="ghost"
            disabled={isSubmitting}
            className="transition-colors cursor-pointer"
          >
            {hasReported ? "Close" : "Cancel"}
          </Button>
          {!hasReported && (
            <Button
              onClick={handleSubmit}
              disabled={!selectedReason || isSubmitting}
              className="bg-warning hover:bg-warning/80 text-warning-foreground transition-colors cursor-pointer"
            >
              {isSubmitting ? "Reporting..." : "Report Comment"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;
