import { createContext, useContext, useState, type ReactNode } from "react";

interface HomeLockValue {
  contentHidden: boolean;
  setContentHidden: (hidden: boolean) => void;
}

const HomeLockContext = createContext<HomeLockValue>({
  contentHidden: false,
  setContentHidden: () => {},
});

export function HomeLockProvider({ children }: { children: ReactNode }) {
  const [contentHidden, setContentHidden] = useState(false);
  return (
    <HomeLockContext.Provider value={{ contentHidden, setContentHidden }}>
      {children}
    </HomeLockContext.Provider>
  );
}

export function useHomeLock() {
  return useContext(HomeLockContext);
}