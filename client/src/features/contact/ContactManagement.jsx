import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getContacts,
  updateContactStatus,
  deleteContact,
} from "./contactSlice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FilterCard } from "@/components/common/FilterCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomDialog, CustomDialogFooter } from "@/components/common/CustomDialog";
import { Trash2, Eye, Mail, MailOpen, RefreshCw, Filter, Search, Reply } from "lucide-react";
import { EmptyState, LoadingState } from "@/components/common/StateDisplays";
import { showToast } from "@/utils/showToast";
import Pagination from "@/components/common/Pagination";
import { format } from "date-fns";
import { PageStats } from "@/components/common/PageStats";

const ContactManagement = () => {
  const dispatch = useDispatch();
  const { contacts, pagination, isLoading, isError, message } = useSelector(
    (state) => state.contact
  );
  const [page, setPage] = useState(1);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pendingSearchQuery, setPendingSearchQuery] = useState("");
  const [pendingStatusFilter, setPendingStatusFilter] = useState("all");

  useEffect(() => {
    dispatch(getContacts({ page, limit: 10, search: searchQuery, status: statusFilter }));
  }, [dispatch, page, searchQuery, statusFilter]);

  useEffect(() => {
    if (isError) {
      showToast("error", message || "Failed to load contacts");
    }
  }, [isError, message]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleView = (contact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
    if (contact.status === "unread") {
      dispatch(updateContactStatus({ id: contact._id, status: "read" }))
        .unwrap()
        .catch((err) => showToast("error", err));
    }
  };

  const handleToggleStatus = (e, contact) => {
    e.stopPropagation();
    const newStatus = contact.status === "read" ? "unread" : "read";
    dispatch(updateContactStatus({ id: contact._id, status: newStatus }))
      .unwrap()
      .catch((err) => showToast("error", err));
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this message?")) {
      dispatch(deleteContact(id))
        .unwrap()
        .then(() => showToast("success", "Contact message deleted"))
        .catch((err) => showToast("error", err));
    }
  };

  const handleRefresh = () => {
    setPendingSearchQuery("");
    setPendingStatusFilter("all");
    setSearchQuery("");
    setStatusFilter("all");
    setPage(1);
    dispatch(getContacts({ page: 1, limit: 10, search: "", status: "all" }));
  };

  if (isLoading && contacts.length === 0) return <LoadingState />;

  return (
    <section className="p-2 sm:p-4 md:p-6 space-y-6" aria-label="Contact Management">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2 mb-2">
          <Mail className="w-8 h-8 text-primary" />
          Contact Messages
        </h1>
        <PageStats
          stats={[
            { value: pagination?.total || 0, label: "messages" },
            { value: contacts.filter(c => c.status === "unread").length, label: "unread" },
          ]}
        />
      </div>

      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 w-9 sm:w-auto p-0 sm:px-3"
        >
          <RefreshCw
            className={`w-7 h-7 sm:w-4 sm:h-4 ${isLoading ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="cursor-pointer flex items-center justify-center gap-2 w-9 sm:w-auto p-0 sm:px-3"
        >
          <Filter className="w-7 h-7 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Filters</span>
        </Button>
      </div>

      <FilterCard
        isOpen={showFilters}
        onClear={() => {
          setPendingSearchQuery("");
          setPendingStatusFilter("all");
          setSearchQuery("");
          setStatusFilter("all");
        }}
        onApply={() => {
          setSearchQuery(pendingSearchQuery);
          setStatusFilter(pendingStatusFilter);
        }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={pendingSearchQuery}
            onChange={(e) => setPendingSearchQuery(e.target.value)}
            className="pl-10 h-10 sm:h-9 text-sm cursor-text"
          />
        </div>

        <Select value={pendingStatusFilter} onValueChange={setPendingStatusFilter}>
          <SelectTrigger className="w-full h-10 sm:h-9 text-sm cursor-pointer">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
          </SelectContent>
        </Select>
      </FilterCard>

      {contacts.length === 0 ? (
        <EmptyState message="No contact messages found" />
      ) : (
        <>
          <Card className="border shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow
                    key={contact._id}
                    className={`cursor-pointer transition-colors ${
                      contact.status === "unread"
                        ? "bg-muted/50 font-medium"
                        : ""
                    }`}
                    onClick={() => handleView(contact)}
                  >
                    <TableCell>
                      {contact.status === "unread" ? (
                        <Badge variant="default" className="bg-primary/90">
                          New
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Read
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(contact.createdAt), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell>{contact.userName}</TableCell>
                    <TableCell>{contact.email}</TableCell>
                    <TableCell className="max-w-50 truncate">
                      {contact.subject}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleToggleStatus(e, contact)}
                          title={
                            contact.status === "read"
                              ? "Mark as unread"
                              : "Mark as read"
                          }
                        >
                          {contact.status === "read" ? (
                            <Mail className="h-4 w-4" />
                          ) : (
                            <MailOpen className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDelete(e, contact._id)}
                          title="Delete message"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </CardContent>
          </Card>
          {pagination.pages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}

      {/* Message View Modal */}
      <CustomDialog 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={`Message from ${selectedContact?.userName}`}
        maxWidth="38rem"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground font-semibold">Email:</span>
              <p>{selectedContact?.email}</p>
            </div>
            <div>
              <span className="text-muted-foreground font-semibold">Date:</span>
              <p>
                {selectedContact &&
                  format(
                    new Date(selectedContact.createdAt),
                    "MMM d, yyyy h:mm a"
                  )}
              </p>
            </div>
          </div>
          <div className="border-t pt-4">
            <span className="text-muted-foreground font-semibold">Subject:</span>
            <p className="font-medium text-lg mt-1">
              {selectedContact?.subject}
            </p>
          </div>
          <div className="border-t pt-4">
            <span className="text-muted-foreground font-semibold">Message:</span>
            <div className="mt-2 p-4 bg-muted/30 rounded-md whitespace-pre-wrap text-sm leading-relaxed max-h-75 overflow-y-auto">
              {selectedContact?.message}
            </div>
          </div>
        </div>
        <CustomDialogFooter>
          <Button
            variant="default"
            className="w-full sm:w-auto"
            onClick={() => {
              window.location.href = `mailto:${selectedContact?.email}?subject=Re: ${encodeURIComponent(selectedContact?.subject)}`;
            }}
          >
            <Reply className="w-4 h-4 mr-2" />
            Reply
          </Button>
        </CustomDialogFooter>
      </CustomDialog>
    </section>
  );
};

export default ContactManagement;
