import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllUsers,
  deleteUser,
  changeUserRole,
  selectAllUsers,
  selectAllUsersLoading,
  selectAllUsersError,
  selectUsersPagination,
} from "./userSlice";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import {
  Users,
  Trash2,
  Crown,
  User as UserIcon,
  Search,
  Filter,
  Download,
  UserCog,
  RefreshCw,
  Edit,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { showToast } from "../../utils/showToast";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Pagination from "../../components/common/Pagination";

const UserManagement = () => {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);

  const users = useSelector(selectAllUsers);
  const loading = useSelector(selectAllUsersLoading);
  const error = useSelector(selectAllUsersError);
  const pagination = useSelector(selectUsersPagination);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [roleChangeUser, setRoleChangeUser] = useState(null);
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    const params = {
      page: currentPage,
      limit: 10,
      search: searchQuery,
      role: roleFilter !== "all" ? roleFilter : "",
    };

    dispatch(fetchAllUsers(params));
  }, [dispatch, currentPage, searchQuery, roleFilter]);

  const processedUsers = useMemo(() => {
    let filteredUsers = [...users];

    if (statusFilter !== "all") {
      filteredUsers = filteredUsers.filter((user) => {
        switch (statusFilter) {
          case "verified":
            return user.emailVerified;
          case "unverified":
            return !user.emailVerified;
          case "recent": {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return new Date(user.createdAt) > weekAgo;
          }
          default:
            return true;
        }
      });
    }

    filteredUsers.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "name":
          return (a.personal_info?.name || "").localeCompare(
            b.personal_info?.name || ""
          );
        case "email":
          return (a.personal_info?.email || "").localeCompare(
            b.personal_info?.email || ""
          );
        case "role":
          return (a.role || "").localeCompare(b.role || "");
        case "newest":
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return filteredUsers;
  }, [users, statusFilter, sortBy]);

  const analytics = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "admin").length;
    const authors = users.filter((u) => u.role === "author").length;
    const regularUsers = users.filter((u) => u.role === "user").length;
    const verified = users.filter((u) => u.emailVerified).length;
    const recentSignups = users.filter((u) => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(u.createdAt) > weekAgo;
    }).length;

    return {
      total,
      admins,
      authors,
      regularUsers,
      verified,
      recentSignups,
      verificationRate: total > 0 ? Math.round((verified / total) * 100) : 0,
    };
  }, [users]);

  const handleDeleteUser = async (userId) => {
    try {
      await dispatch(deleteUser(userId)).unwrap();
      showToast("success", "User deleted successfully");
    } catch (error) {
      showToast("error", error || "Failed to delete user");
    }
  };

  const handleRoleChange = async () => {
    if (!roleChangeUser || !newRole) return;

    try {
      await dispatch(
        changeUserRole({
          userId: roleChangeUser._id,
          role: newRole,
        })
      ).unwrap();
      showToast("success", `User role changed to ${newRole} successfully`);
      setRoleChangeUser(null);
      setNewRole("");
    } catch (error) {
      showToast("error", error || "Failed to change user role");
    }
  };

  const handleRefresh = () => {
    const params = {
      page: currentPage,
      limit: 10,
      search: searchQuery,
      role: roleFilter !== "all" ? roleFilter : "",
    };
    dispatch(fetchAllUsers(params));
  };

  const exportUsers = () => {
    const data = processedUsers.map((user) => ({
      name: user.personal_info?.name || "",
      email: user.personal_info?.email || "",
      username: user.personal_info?.username || "",
      role: user.role || "",
      verified: user.emailVerified ? "Yes" : "No",
      joinDate: new Date(user.createdAt).toISOString().split("T")[0],
      lastLogin: user.lastLogin
        ? new Date(user.lastLogin).toISOString().split("T")[0]
        : "Never",
    }));

    const csv = [
      [
        "Name",
        "Email",
        "Username",
        "Role",
        "Verified",
        "Join Date",
        "Last Login",
      ],
      ...data.map((row) => [
        row.name,
        row.email,
        row.username,
        row.role,
        row.verified,
        row.joinDate,
        row.lastLogin,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTimeSinceSignup = (dateString) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case "admin":
        return "default";
      case "author":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <Crown className="w-3 h-3 mr-1" />;
      case "author":
        return <Edit className="w-3 h-3 mr-1" />;
      default:
        return <UserIcon className="w-3 h-3 mr-1" />;
    }
  };

  const canDeleteUser = (user) => {
    return user.role !== "admin" && user._id !== currentUser?._id;
  };

  const canChangeRole = (user) => {
    return user._id !== currentUser?._id && user.role !== "admin";
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2 mb-2">
            User Management
          </h1>
        </div>
        <Card>
          <CardContent>
            <div className="text-center py-8">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/60" />
              <h2 className="text-xl font-semibold mb-2 text-muted-foreground">
                No Users Found
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-4">
                No users have registered yet.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <section className="p-6 space-y-6" aria-label="User Management">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2 mb-2">
          User Management
        </h1>
        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
          <span>{analytics.total} users</span>
          <span>•</span>
          <span>{analytics.verified} verified</span>
          {analytics.recentSignups > 0 && (
            <>
              <span>•</span>
              <span>{analytics.recentSignups} this week</span>
            </>
          )}
          {analytics.admins > 0 && (
            <>
              <span>•</span>
              <span>{analytics.admins} admins</span>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="cursor-pointer disabled:cursor-not-allowed"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={exportUsers}
          className="cursor-pointer"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="cursor-pointer"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 cursor-text"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Role</label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="author">Author</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                    <SelectItem value="recent">Recent Signups</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="role">Role</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="hidden lg:block">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-muted/50">
                    <TableHead className="text-left py-3 px-4 font-medium text-muted-foreground">
                      User
                    </TableHead>
                    <TableHead className="text-center py-3 px-4 font-medium text-muted-foreground">
                      Email
                    </TableHead>
                    <TableHead className="text-center py-3 px-4 font-medium text-muted-foreground">
                      Role
                    </TableHead>
                    <TableHead className="text-center py-3 px-4 font-medium text-muted-foreground">
                      Joined
                    </TableHead>
                    <TableHead className="text-center py-3 px-4 font-medium text-muted-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedUsers.map((user) => (
                    <TableRow
                      key={user._id}
                      className="border-b hover:bg-muted/30 transition-colors group"
                    >
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={user.personal_info?.profile_img}
                              alt={user.personal_info?.name || "User"}
                            />
                            <AvatarFallback>
                              {user.personal_info?.name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                user.personal_info?.username
                                  ?.charAt(0)
                                  ?.toUpperCase() ||
                                "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            {user.personal_info?.username ? (
                              <Link
                                to={`/${user.personal_info.username}`}
                                className="font-medium hover:text-primary transition-colors cursor-pointer hover:underline"
                              >
                                {user.personal_info?.name || "Unnamed User"}
                              </Link>
                            ) : (
                              <p className="font-medium">
                                {user.personal_info?.name || "Unnamed User"}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              {user.personal_info?.username
                                ? `@${user.personal_info.username}`
                                : user.personal_info?.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-sm truncate max-w-[200px]">
                            {user.personal_info?.email}
                          </span>
                          {user.emailVerified && (
                            <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-4 text-center">
                        <Badge
                          variant={getRoleBadgeVariant(user.role)}
                          className="text-xs"
                        >
                          {getRoleIcon(user.role)}
                          {user.role}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-4 px-4 text-center">
                        <div>
                          <div className="text-sm font-medium">
                            {formatDate(user.createdAt)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getTimeSinceSignup(user.createdAt)}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          {canChangeRole(user) && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="transition-colors duration-200 hover:bg-primary hover:text-primary-foreground cursor-pointer"
                                  title="Change Role"
                                  onClick={() => {
                                    setRoleChangeUser(user);
                                    setNewRole(user.role);
                                  }}
                                >
                                  <UserCog className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Change User Role</DialogTitle>
                                  <DialogDescription>
                                    Change the role for{" "}
                                    {user.personal_info?.name || "this user"}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                  <Select
                                    value={newRole}
                                    onValueChange={setNewRole}
                                  >
                                    <SelectTrigger className="cursor-pointer">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="user">User</SelectItem>
                                      <SelectItem value="author">
                                        Author
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setRoleChangeUser(null);
                                      setNewRole("");
                                    }}
                                    className="cursor-pointer"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleRoleChange}
                                    disabled={loading || newRole === user.role}
                                    className="cursor-pointer disabled:cursor-not-allowed"
                                  >
                                    Change Role
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}

                          {canDeleteUser(user) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="transition-colors duration-200 hover:text-destructive hover:border-destructive cursor-pointer"
                                  title="Delete User"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete User
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete{" "}
                                    {user.personal_info?.name || "this user"}?
                                    This action cannot be undone and will
                                    permanently remove their account and all
                                    associated data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="cursor-pointer">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user._id)}
                                    className="bg-destructive hover:bg-destructive/80 cursor-pointer"
                                  >
                                    Delete User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:hidden space-y-4">
        {processedUsers.map((user) => (
          <Card key={user._id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.personal_info?.profile_img}
                        alt={user.personal_info?.name || "User"}
                      />
                      <AvatarFallback>
                        {user.personal_info?.name?.charAt(0)?.toUpperCase() ||
                          user.personal_info?.username
                            ?.charAt(0)
                            ?.toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      {user.personal_info?.username ? (
                        <Link
                          to={`/${user.personal_info.username}`}
                          className="font-medium text-lg hover:text-primary transition-colors cursor-pointer hover:underline"
                        >
                          {user.personal_info?.name || "Unnamed User"}
                        </Link>
                      ) : (
                        <p className="font-medium text-lg">
                          {user.personal_info?.name || "Unnamed User"}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {user.personal_info?.username
                          ? `@${user.personal_info.username}`
                          : user.personal_info?.email}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={getRoleBadgeVariant(user.role)}
                    className="text-xs"
                  >
                    {getRoleIcon(user.role)}
                    {user.role}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[150px]">
                        {user.personal_info?.email}
                      </span>
                      {user.emailVerified && (
                        <CheckCircle className="h-4 w-4 text-success" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Joined:</span>
                    <span>{formatDate(user.createdAt)}</span>
                  </div>
                </div>

                <div className="flex justify-center gap-2 pt-2 border-t">
                  {canChangeRole(user) && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-3 py-1 h-8 text-xs transition-colors duration-200 hover:bg-primary hover:text-primary-foreground cursor-pointer"
                          title="Change Role"
                          onClick={() => {
                            setRoleChangeUser(user);
                            setNewRole(user.role);
                          }}
                        >
                          <UserCog className="h-3 w-3 mr-1" />
                          Role
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change User Role</DialogTitle>
                          <DialogDescription>
                            Change the role for{" "}
                            {user.personal_info?.name || "this user"}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Select value={newRole} onValueChange={setNewRole}>
                            <SelectTrigger className="cursor-pointer">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="author">Author</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setRoleChangeUser(null);
                              setNewRole("");
                            }}
                            className="cursor-pointer"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleRoleChange}
                            disabled={loading || newRole === user.role}
                            className="cursor-pointer disabled:cursor-not-allowed"
                          >
                            Change Role
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}

                  {canDeleteUser(user) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-3 py-1 h-8 text-xs transition-colors duration-200 hover:text-destructive hover:border-destructive cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete User</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            {user.personal_info?.name || "this user"}? This
                            action cannot be undone and will permanently remove
                            their account and all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="cursor-pointer">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteUser(user._id)}
                            className="bg-destructive hover:bg-destructive/80 cursor-pointer"
                          >
                            Delete User
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pagination.totalUsers > 10 && (
        <div className="flex justify-center">
          <Pagination
            totalPages={pagination.totalPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalBlogs={pagination.totalUsers}
            paginationThreshold={10}
          />
        </div>
      )}

      {processedUsers.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {processedUsers.length} of {analytics.total} users
        </div>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
};

export default UserManagement;
