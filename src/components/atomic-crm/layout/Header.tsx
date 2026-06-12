import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Settings, User } from "lucide-react";
import { CanAccess, useGetList } from "ra-core";
import { Link, matchPath, useLocation } from "react-router";
import { RefreshButton } from "@/components/admin/refresh-button";
import { ThemeModeToggle } from "@/components/admin/theme-mode-toggle";
import { UserMenu } from "@/components/admin/user-menu";
import { useUserMenu } from "@/hooks/user-menu-context";

import { useConfigurationContext } from "../root/ConfigurationContext";
import logoNoir from "../../../assets/Noir.png";

const Header = () => {
  const { darkModeLogo, lightModeLogo, title } = useConfigurationContext();
  const location = useLocation();

  const orgName = "Technology Simplified";
  const orgLogo = logoNoir;

  let currentPath: string | boolean = "/";
  if (matchPath("/", location.pathname)) {
    currentPath = "/";
  } else if (matchPath("/contacts/*", location.pathname)) {
    currentPath = "/contacts";
  } else if (matchPath("/companies/*", location.pathname)) {
    currentPath = "/companies";
  } else if (matchPath("/deals/*", location.pathname)) {
    currentPath = "/deals";
  } else if (matchPath("/contracts/*", location.pathname)) {
    currentPath = "/contracts";
  } else if (matchPath("/device_events/*", location.pathname)) {
    currentPath = "/device_events";
  } else {
    currentPath = false;
  }

  return (
    <nav className="flex-grow">
      <header className="bg-secondary">
        <div className="px-4">
          <div className="flex justify-between items-center flex-1">
            <Link
              to="/"
              className="flex items-center gap-2 text-secondary-foreground no-underline"
            >
              <img
                className="h-6"
                src={orgLogo}
                alt={orgName}
              />
              <h1 className="text-xl font-semibold">{orgName}</h1>
            </Link>
            <div>
              <nav className="flex">
                <NavigationTab
                  label="Dashboard"
                  to="/"
                  isActive={currentPath === "/"}
                />
                <NavigationTab
                  label="Contacts"
                  to="/contacts"
                  isActive={currentPath === "/contacts"}
                />
                <NavigationTab
                  label="Clients"
                  to="/companies"
                  isActive={currentPath === "/companies"}
                />
                <NavigationTab
                  label="Deals"
                  to="/deals"
                  isActive={currentPath === "/deals"}
                />
                <NavigationTab
                  label="Service Contracts"
                  to="/contracts"
                  isActive={currentPath === "/contracts"}
                />
                <NavigationTab
                  label="OvrC"
                  to="/device_events/reports"
                  isActive={currentPath === "/device_events"}
                />
                <NavigationTab
                  label="Messages"
                  to="/admin/conversations"
                  isActive={location.pathname === "/admin/conversations"}
                />
              </nav>
            </div>
            <div className="flex items-center">
              <ThemeModeToggle />
              <RefreshButton />
              <UserMenu>
                <ConfigurationMenu />
                <CanAccess resource="sales" action="list">
                  <UsersMenu />
                </CanAccess>
              </UserMenu>
            </div>
          </div>
        </div>
      </header>
    </nav>
  );
};

const NavigationTab = ({
  label,
  to,
  isActive,
}: {
  label: string;
  to: string;
  isActive: boolean;
}) => (
  <Link
    to={to}
    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${isActive
      ? "text-secondary-foreground border-secondary-foreground"
      : "text-secondary-foreground/70 border-transparent hover:text-secondary-foreground/80"
      }`}
  >
    {label}
  </Link>
);

const UsersMenu = () => {
  const { onClose } = useUserMenu() ?? {};
  return (
    <DropdownMenuItem asChild onClick={onClose}>
      <Link to="/sales" className="flex items-center gap-2">
        <User /> Users
      </Link>
    </DropdownMenuItem>
  );
};

const ConfigurationMenu = () => {
  const { onClose } = useUserMenu() ?? {};
  return (
    <>
      <DropdownMenuItem asChild onClick={onClose}>
        <Link to="/settings" className="flex items-center gap-2">
          <Settings />
          My info
        </Link>
      </DropdownMenuItem>
      <CanAccess resource="crm_settings" action="edit">
        <DropdownMenuItem asChild onClick={onClose}>
          <Link to="/organization" className="flex items-center gap-2">
            <Settings />
            Organization
          </Link>
        </DropdownMenuItem>
      </CanAccess>
    </>
  );
};
export default Header;
