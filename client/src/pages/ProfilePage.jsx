import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import userService from "../features/user_management/usersService";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  FaArrowLeft,
  FaGlobe,
  FaLinkedin,
  FaGithub,
  FaYoutube,
  FaFacebook,
  FaInstagram,
  FaCalendar,
  FaGraduationCap,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Link } from "react-router-dom";
import LoadingSpinner from "../components/common/LoadingSpinner";

const ProfilePage = React.memo(() => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize profile type checks
  const isPublicProfile = useMemo(
    () =>
      username &&
      username !== user?.personal_info?.username &&
      username !== user?.username,
    [username, user?.personal_info?.username, user?.username]
  );

  const isOwnProfile = useMemo(
    () =>
      !username ||
      username === user?.personal_info?.username ||
      username === user?.username,
    [username, user?.personal_info?.username, user?.username]
  );

  // Memoize helper functions
  const getSocialIcon = useCallback((platform) => {
    const iconMap = {
      website: FaGlobe,
      linkedin: FaLinkedin,
      github: FaGithub,
      youtube: FaYoutube,
      facebook: FaFacebook,
      twitter: FaXTwitter,
      instagram: FaInstagram,
    };
    return iconMap[platform] || FaGlobe;
  }, []);

  const formatSocialUrl = useCallback((platform, username) => {
    if (!username) return null;

    const urlMap = {
      website: username.startsWith("http") ? username : `https://${username}`,
      linkedin: `https://linkedin.com/in/${username}`,
      github: `https://github.com/${username}`,
      youtube: `https://youtube.com/@${username}`,
      facebook: `https://facebook.com/${username}`,
      twitter: `https://x.com/${username}`,
      instagram: `https://instagram.com/${username}`,
    };
    return urlMap[platform] || username;
  }, []);

  // Memoize navigation handler
  const handleBackClick = useCallback(() => {
    if (isPublicProfile) {
      navigate("/");
    } else {
      navigate("/");
    }
  }, [isPublicProfile, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        if (isPublicProfile) {
          const response = await userService.getPublicProfile(username);
          setProfile(response.user);
        } else {
          setProfile(user);
        }
      } catch (err) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, user, isPublicProfile, isOwnProfile]);

  // Show loading spinner while profile is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex justify-center items-center min-h-[50vh]">
          <LoadingSpinner size="lg" message="Loading profile..." />
        </div>
      </div>
    );
  }

  // Show error state if profile loading failed
  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-4">
              Error Loading Profile
            </h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleBackClick} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if profile exists
  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex justify-center items-center min-h-screen p-6">
          <div className="text-center max-w-2xl w-full space-y-8">
            {/* Error Code */}
            <div>
              <h2 className="text-8xl sm:text-9xl font-bold text-primary/20 select-none">
                404
              </h2>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              Profile Not Found
            </h1>

            {/* Error Message */}
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md mx-auto">
              The requested profile could not be loaded.
            </p>

            {/* Action Button */}
            <div className="pt-4">
              <Button 
                onClick={handleBackClick} 
                variant="outline"
                size="lg"
                className="px-6 py-3 text-base min-w-[200px]"
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasSocialLinks =
    profile?.social_links &&
    Object.values(profile.social_links).some((link) => link);

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/5 to-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-primary/5 to-primary/10 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-6 relative">
        {/* Back Button */}
        {isPublicProfile && (
          <div className="mb-2 sm:mb-4">
            <Button
              variant="ghost"
              onClick={handleBackClick}
              className="hover:bg-transparent text-sm sm:text-base"
            >
              <FaArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        )}

        {/* Mobile Layout - Small screens */}
        <div className="block sm:hidden">
          <div className="flex items-center gap-4 sm:gap-3 mb-3 sm:mb-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 p-1">
                <Avatar className="w-full h-full border-2 border-background">
                  <AvatarImage
                    src={profile.personal_info?.profile_img || profile.avatar}
                    alt={profile.personal_info?.name || profile.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-base sm:text-lg font-semibold bg-background text-primary">
                    {(profile.personal_info?.name || profile.name || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <p className="text-base text-muted-foreground mb-1">
                <span className="inline-block break-words">
                  {profile.personal_info?.username || profile.username}
                </span>
              </p>
              <h1 className="text-base sm:text-lg font-bold text-foreground mb-1 leading-tight break-words uppercase">
                {profile.personal_info?.name || profile.name}
              </h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 sm:gap-3 w-full max-w-sm mb-6 sm:mb-8">
            {(profile.role === "author" || profile.role === "admin") && (
              <Button
                className="rounded-full font-medium w-full bg-foreground text-background hover:bg-foreground/90 text-sm sm:text-base py-2 sm:py-2.5"
                asChild
              >
                <Link
                  to={`/${
                    profile.personal_info?.username || profile.username
                  }/blogs`}
                >
                  View User's Blogs
                </Link>
              </Button>
            )}

            {/* Edit Profile Button - Only show for current user */}
            {!isPublicProfile && (
              <Button
                variant="outline"
                className="rounded-full font-medium w-full text-sm sm:text-base py-2 sm:py-2.5"
                asChild
              >
                <Link to="/edit-profile">Edit Profile</Link>
              </Button>
            )}

            {/* Change Password Button - Only show for current user */}
            {!isPublicProfile && (
              <Button
                variant="outline"
                className="rounded-full font-medium w-full text-sm sm:text-base py-2 sm:py-2.5"
                asChild
              >
                <Link to="/change-password">Change Password</Link>
              </Button>
            )}
          </div>

          {/* Profile Details */}
          <div className="space-y-3 sm:space-y-4 text-sm sm:text-base mb-6 sm:mb-8">
            {profile.personal_info?.education && (
              <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
                <FaGraduationCap className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>{profile.personal_info.education}</span>
              </div>
            )}

            {profile.personal_info?.location && (
              <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
                <FaMapMarkerAlt className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>{profile.personal_info.location}</span>
              </div>
            )}

            {(profile.joinedAt || profile.createdAt) && (
              <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
                <FaCalendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>
                  Joined{" "}
                  {new Date(
                    profile.joinedAt || profile.createdAt
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}

            {/* Social Links */}
            {hasSocialLinks && (
              <div className="pt-2 space-y-2 sm:space-y-3">
                {Object.entries(profile.social_links).map(
                  ([platform, username]) => {
                    if (!username) return null;
                    const IconComponent = getSocialIcon(platform);
                    const url = formatSocialUrl(platform, username);
                    const displayName =
                      platform === "github"
                        ? username
                        : platform === "linkedin"
                        ? `${username}`
                        : platform === "twitter"
                        ? `${username}`
                        : platform === "website"
                        ? url.replace(/^https?:\/\//, "")
                        : username;

                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 sm:gap-3 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <IconComponent className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{displayName}</span>
                      </a>
                    );
                  }
                )}
              </div>
            )}
          </div>

          {/* About Section */}
          <div className="border-t pt-6 sm:pt-8">
            <div className="flex items-center mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg sm:text-xl font-semibold">About</h2>
              <div className="ml-3 sm:ml-4 h-0.5 bg-primary w-6 sm:w-8"></div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 sm:mb-4 text-foreground text-sm sm:text-base">
                Bio
              </h3>
              {profile.personal_info?.bio ? (
                <p className="text-foreground leading-relaxed text-base sm:text-lg">
                  {profile.personal_info.bio}
                </p>
              ) : (
                <p className="text-muted-foreground italic text-base sm:text-lg">
                  No bio available.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tablet Layout - Medium screens */}
        <div className="hidden sm:block lg:hidden">
          <div className="flex items-center gap-4 mb-8">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 p-1">
                <Avatar className="w-full h-full border-2 border-background">
                  <AvatarImage
                    src={profile.personal_info?.profile_img || profile.avatar}
                    alt={profile.personal_info?.name || profile.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-xl font-semibold bg-background text-primary">
                    {(profile.personal_info?.name || profile.name || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <p className="text-base text-muted-foreground mb-1">
                <span className="inline-block">
                  {profile.personal_info?.username || profile.username}
                </span>
              </p>
              <h1 className="text-xl font-bold text-foreground mb-2 leading-tight break-words uppercase">
                {profile.personal_info?.name || profile.name}
              </h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-8">
            {(profile.role === "author" || profile.role === "admin") && (
              <Button
                className="rounded-full font-medium bg-foreground text-background hover:bg-foreground/90"
                asChild
              >
                <Link
                  to={`/${
                    profile.personal_info?.username || profile.username
                  }/blogs`}
                >
                  View User's Blogs
                </Link>
              </Button>
            )}

            {/* Edit Profile Button - Only show for current user */}
            {!isPublicProfile && (
              <Button
                variant="outline"
                className="rounded-full font-medium"
                asChild
              >
                <Link to="/edit-profile">Edit Profile</Link>
              </Button>
            )}

            {/* Change Password Button - Only show for current user */}
            {!isPublicProfile && (
              <Button
                variant="outline"
                className="rounded-full font-medium"
                asChild
              >
                <Link to="/change-password">Change Password</Link>
              </Button>
            )}
          </div>

          {/* Profile Details */}
          <div className="space-y-4 text-base mb-8">
            {profile.personal_info?.education && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <FaGraduationCap className="w-4 h-4 flex-shrink-0" />
                <span>{profile.personal_info.education}</span>
              </div>
            )}

            {profile.personal_info?.location && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <FaMapMarkerAlt className="w-4 h-4 flex-shrink-0" />
                <span>{profile.personal_info.location}</span>
              </div>
            )}

            {(profile.joinedAt || profile.createdAt) && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <FaCalendar className="w-4 h-4 flex-shrink-0" />
                <span>
                  Joined{" "}
                  {new Date(
                    profile.joinedAt || profile.createdAt
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}

            {/* Social Links */}
            {hasSocialLinks && (
              <div className="pt-2 space-y-3">
                {Object.entries(profile.social_links).map(
                  ([platform, username]) => {
                    if (!username) return null;
                    const IconComponent = getSocialIcon(platform);
                    const url = formatSocialUrl(platform, username);
                    const displayName =
                      platform === "github"
                        ? username
                        : platform === "linkedin"
                        ? `${username}`
                        : platform === "twitter"
                        ? `${username}`
                        : platform === "website"
                        ? url.replace(/^https?:\/\//, "")
                        : username;

                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <IconComponent className="w-4 h-4 flex-shrink-0" />
                        <span className="text-base truncate">{displayName}</span>
                      </a>
                    );
                  }
                )}
              </div>
            )}
          </div>

          {/* About Section */}
          <div className="border-t pt-8">
            <div className="flex items-center mb-6">
              <h2 className="text-xl font-semibold">About</h2>
              <div className="ml-4 h-0.5 bg-primary w-8"></div>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-foreground">Bio</h3>
              {profile.personal_info?.bio ? (
                <p className="text-foreground leading-relaxed text-base sm:text-lg">
                  {profile.personal_info.bio}
                </p>
              ) : (
                <p className="text-muted-foreground italic text-base sm:text-lg">
                  No bio available.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Layout - Large screens */}
        <div className="hidden lg:block">
          {/* Main Profile Section */}
          <div className="max-w-4xl mx-auto p-8 ml-16">
            {/* Profile Header - Kaggle Style */}
            <div className="mb-8">
              {/* Profile Info */}
              <div>
                <div className="flex gap-6 mb-6">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-48 h-48 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 p-1">
                      <Avatar className="w-full h-full border-2 border-background">
                        <AvatarImage
                          src={
                            profile.personal_info?.profile_img || profile.avatar
                          }
                          alt={profile.personal_info?.name || profile.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-5xl font-semibold bg-background text-primary">
                          {(profile.personal_info?.name || profile.name || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 flex flex-col justify-center ml-8">
                    <p className="text-base text-muted-foreground mb-1">
                      <span className="inline-block">
                        {profile.personal_info?.username || profile.username}
                      </span>
                    </p>
                    <h1 className="text-4xl font-bold text-foreground mb-2 leading-tight break-words uppercase">
                      {profile.personal_info?.name || profile.name}
                    </h1>

                    {/* Joined Date Above Social Links */}
                      {(profile.joinedAt || profile.createdAt) && (
                        <div className="flex items-center gap-2 mb-3">
                          <FaCalendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-base text-muted-foreground">
                            Joined{" "}
                            {new Date(
                              profile.joinedAt || profile.createdAt
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      )}

                    {/* Social Links - Desktop */}
                    {hasSocialLinks && (
                      <div className="pt-2 space-y-2 mb-4">
                        {Object.entries(profile.social_links).map(
                          ([platform, username]) => {
                            if (!username) return null;
                            const IconComponent = getSocialIcon(platform);
                            const url = formatSocialUrl(platform, username);
                            const displayName =
                              platform === "github"
                                ? username
                                : platform === "linkedin"
                                ? `${username}`
                                : platform === "twitter"
                                ? `${username}`
                                : platform === "website"
                                ? url.replace(/^https?:\/\//, "")
                                : username;

                            return (
                              <a
                                key={platform}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <IconComponent className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="text-base truncate">
                                  {displayName}
                                </span>
                              </a>
                            );
                          }
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 flex-wrap">
                      {(profile.role === "author" ||
                        profile.role === "admin") && (
                        <Button
                          className="rounded-full font-medium px-6 bg-foreground text-background hover:bg-foreground/90"
                          asChild
                        >
                          <Link
                            to={`/${
                              profile.personal_info?.username ||
                              profile.username
                            }/blogs`}
                          >
                            View User's Blogs
                          </Link>
                        </Button>
                      )}

                      {/* Edit Profile Button - Only show for current user */}
                      {!isPublicProfile && (
                        <Button
                          variant="outline"
                          className="rounded-full font-medium px-6"
                          asChild
                        >
                          <Link to="/edit-profile">Edit Profile</Link>
                        </Button>
                      )}

                      {/* Change Password Button - Only show for current user */}
                      {!isPublicProfile && (
                        <Button
                          variant="outline"
                          className="rounded-full font-medium px-6"
                          asChild
                        >
                          <Link to="/change-password">Change Password</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Details - Below Profile */}
                <div className="space-y-4 text-base">
                  {profile.personal_info?.education && (
                    <div className="flex items-start gap-3 text-muted-foreground">
                      <FaGraduationCap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{profile.personal_info.education}</span>
                    </div>
                  )}

                  {profile.personal_info?.location && (
                    <div className="flex items-start gap-3 text-muted-foreground">
                      <FaMapMarkerAlt className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{profile.personal_info.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* About Section - Full Width */}
            <div className="border-t pt-8">
              <div className="flex items-center mb-6">
                <h2 className="text-xl font-semibold">About</h2>
                <div className="ml-4 h-0.5 bg-primary w-8"></div>
              </div>

              <div>
                <h3 className="font-semibold mb-4 text-foreground">Bio</h3>
                {profile.personal_info?.bio ? (
                  <p className="text-foreground leading-relaxed text-base sm:text-lg">
                    {profile.personal_info.bio}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic text-base">
                    No bio available.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ProfilePage.displayName = "ProfilePage";

export default ProfilePage;
