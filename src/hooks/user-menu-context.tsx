import { UserMenuContext } from "ra-core";
import { useContext } from "react";

export type UserMenuContextValue = {
  /**
   * Closes the user menu
   * @see UserMenu
   */
  onClose: () => void;
};

export const useUserMenu = (): UserMenuContextValue => {
  const context = useContext(UserMenuContext);
  return context ?? { onClose: () => {} };
};

