import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Send, X, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";
import commentService from "./commentsService";
import { refreshNotificationsAfterAction } from "../../utils/notificationRefresh";

import {
  createComment,
  updateComment,
  clearCreateError,
  clearUpdateError,
} from "./commentsSlice";

const CommentForm = ({
  blogId,
  parentId = null,
  commentId = null,
  initialContent = "",
  mode = "create",
  placeholder = "Write a comment...",
  onCancel = null,
  onSuccess = null,
}) => {
  const dispatch = useDispatch();
  // Removed loading selectors for instant UI updates

  const [content, setContent] = useState(initialContent);
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [mentionStartPos, setMentionStartPos] = useState(-1);
  const textareaRef = useRef(null);

  // Removed loading states for instant UI updates
  const isLoading = false; // Always false for instant interactions
  const isValid = content.trim().length > 0 && content.trim().length <= 1000;

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    if (mode === "edit") {
      dispatch(clearUpdateError(commentId));
    } else {
      dispatch(clearCreateError());
    }
  }, [dispatch, mode, commentId]);

  // Handle user search for mentions
  const searchUsers = async (query) => {
    if (query.length < 1) {
      setUserSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const result = await commentService.searchUsers(query);
      setUserSuggestions(result.users || []);
      setShowSuggestions(true);
      setSelectedSuggestionIndex(-1);
    } catch (error) {
      console.error("Error searching users:", error);
      setUserSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle content change with mention detection
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    const cursorPos = e.target.selectionStart;

    setContent(newContent);

    // Detect @ mentions for user suggestions
    const textUpToCursor = newContent.substring(0, cursorPos);
    const lastAtPos = textUpToCursor.lastIndexOf("@");

    if (lastAtPos !== -1) {
      const charBeforeAt =
        lastAtPos === 0 ? " " : textUpToCursor[lastAtPos - 1];
      if (charBeforeAt === " " || charBeforeAt === "\n" || lastAtPos === 0) {
        const mentionQuery = textUpToCursor.substring(lastAtPos + 1);
        if (!mentionQuery.includes(" ") && !mentionQuery.includes("\n")) {
          setMentionStartPos(lastAtPos);
          searchUsers(mentionQuery);
          return;
        }
      }
    }

    // Hide suggestions if no valid mention context
    setShowSuggestions(false);
    setUserSuggestions([]);
    setMentionStartPos(-1);
  };

  // Handle suggestion selection
  const selectSuggestion = (user) => {
    if (mentionStartPos === -1) return;

    const beforeMention = content.substring(0, mentionStartPos);
    const afterMention = content.substring(textareaRef.current.selectionStart);
    const newContent =
      beforeMention + `@${user.personal_info.username} ` + afterMention;

    setContent(newContent);
    setShowSuggestions(false);
    setUserSuggestions([]);
    setMentionStartPos(-1);

    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos =
          beforeMention.length + user.personal_info.username.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Handle keyboard navigation for suggestions
  const handleKeyDown = (e) => {
    if (showSuggestions && userSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < userSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : userSuggestions.length - 1
        );
      } else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
        e.preventDefault();
        selectSuggestion(userSuggestions[selectedSuggestionIndex]);
        return;
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
        setUserSuggestions([]);
        setMentionStartPos(-1);
      }
    }

    // Original key handling
    if (e.key === "Enter" && !e.shiftKey && !showSuggestions) {
      e.preventDefault();
      handleSubmit(e);
    }
    if (e.key === "Escape" && onCancel && mode !== "create") {
      onCancel();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValid) {
      return;
    }

    // Validate required fields for comment creation
    if (mode === "create" && !blogId) {
      return;
    }

    if (mode === "reply" && !parentId) {
      return;
    }

    const trimmedContent = content.trim();
    try {
      if (mode === "edit") {
        await dispatch(
          updateComment({ commentId, content: trimmedContent })
        ).unwrap();
      } else {
        const commentData = {
          blog_id: blogId,
          content: trimmedContent,
          parent: parentId,
        };

        await dispatch(createComment(commentData)).unwrap();
      }

      if (mode !== "edit") {
        setContent("");
      }

      // Refresh notifications to show new notifications immediately
      refreshNotificationsAfterAction();

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      } else if (onCancel && (mode === "reply" || mode === "edit")) {
        onCancel();
      }
    } catch {
      // Error handling is done by the Redux slice
      return;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center gap-2 w-full max-w-md">
      <div className="flex-1 min-w-0 bg-muted rounded-full flex items-center pr-1 sm:pr-2 h-8 sm:h-9">
        <input
          ref={textareaRef}
          type="text"
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 min-w-0 text-sm px-3 py-1 sm:px-4 sm:py-1.5 bg-transparent border-none outline-none placeholder-muted-foreground text-foreground"
          maxLength={1000}
          disabled={false}
        />
        {content.trim() && (
          <button
            type="submit"
            disabled={!isValid}
            className={cn(
              "p-1 sm:p-1.5 rounded-full transition-all touch-manipulation flex-shrink-0",
              isValid
                ? "text-primary hover:text-primary/80 hover:bg-primary/10 active:scale-95"
                : "text-muted-foreground cursor-not-allowed"
            )}
          >
            <Send className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>

      {/* User Suggestions Dropdown */}
      {showSuggestions && userSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {userSuggestions.map((user, index) => (
            <div
              key={user._id}
              className={cn(
                "flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted transition-colors",
                selectedSuggestionIndex === index && "bg-muted"
              )}
              onClick={() => selectSuggestion(user)}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                {user.personal_info?.profile_img ? (
                  <img
                    src={user.personal_info.profile_img}
                    alt={user.personal_info?.username || "User"}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <AtSign className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">
                  @{user.personal_info?.username || "unknown"}
                </div>
                {user.personal_info?.username && (
                  <div className="text-xs text-muted-foreground">
                    @{user.personal_info.username}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </form>
  );
};

export default CommentForm;
