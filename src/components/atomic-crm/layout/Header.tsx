import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Settings, User } from "lucide-react";
import { CanAccess } from "ra-core";
import { Link, matchPath, useLocation } from "react-router";
import { RefreshButton } from "@/components/admin/refresh-button";
import { ThemeModeToggle } from "@/components/admin/theme-mode-toggle";
import { UserMenu } from "@/components/admin/user-menu";
import { useUserMenu } from "@/hooks/user-menu-context";

import { useConfigurationContext } from "../root/ConfigurationContext";
import logoNoir from "../../../assets/Noir.png";

const Header = () => {
  const { title } = useConfigurationContext();
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
  } else if (matchPath("/subscriptions/*", location.pathname)) {
    currentPath = "/subscriptions";
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
                  label="Subscriptions"
                  to="/subscriptions"
                  isActive={currentPath === "/subscriptions"}
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
    className={`px-3 py-4 text-sm font-medium border-b-2 hover:border-primary border-transparent text-muted-foreground hover:text-foreground shrink-0 ${
      isActive ? "border-primary text-foreground" : ""
    }`}
  >
    {label}
  </Link>
);

const UsersMenu = () => {
  const { onClose } = useUserMenu();
  return (
    <DropdownMenuItem asChild onClick={onClose}>
      <Link to="/sales" className="flex items-center gap-2 cursor-pointer">
        <User className="h-4 w-4" />
        <span>Users</span>
      </Link>
    </DropdownMenuItem>
  );
};

const ConfigurationMenu = () => {
  const { onClose } = useUserMenu();
  return (
    <DropdownMenuItem asChild onClick={onClose}>
      <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
        <Settings className="h-4 w-4" />
        <span>Settings</span>
      </Link>
    </DropdownMenuItem>
  );
};

export default Header;
