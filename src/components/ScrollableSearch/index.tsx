import React, { createContext, useContext, useState, useMemo, memo } from "react";
import { motion } from "motion/react";

interface IScrollableSearchContext {
  isFocused: boolean;
  setIsFocused: (focused: boolean) => void;
}

const ScrollableSearchContext = createContext<IScrollableSearchContext | null>(null);

const useScrollableSearch = () => {
  const context = useContext(ScrollableSearchContext);
  if (!context) {
    throw new Error("ScrollableSearch compound components must be rendered within <ScrollableSearch>");
  }
  return context;
};

const ScrollableSearchRoot: React.FC<any> = memo(({ children }) => {
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const value = useMemo(() => ({
    isFocused,
    setIsFocused,
  }), [isFocused]);

  return (
    <ScrollableSearchContext.Provider value={value}>
      <div className="flex-1 bg-[#0A0A0A]">{children}</div>
    </ScrollableSearchContext.Provider>
  );
});

const ScrollContent: React.FC<any> = memo(({ children }) => {
  const { isFocused } = useScrollableSearch();
  return (
    <div className={`flex-1 overflow-y-auto pt-[100px] pb-5 ${isFocused ? 'pointer-events-none' : 'pointer-events-auto'}`}>
      {children}
    </div>
  );
});

const AnimatedComponent: React.FC<any> = memo(({ children, focusedOffset = -90, unfocusedOffset = 30 }) => {
  const { isFocused } = useScrollableSearch();
  
  return (
    <motion.div
      animate={{
        y: isFocused ? focusedOffset : unfocusedOffset,
        opacity: 1,
      }}
      className="absolute top-[90px] left-0 right-0 z-100 bg-transparent"
    >
      {children}
    </motion.div>
  );
});

const Overlay: React.FC<any> = memo(({ children, onPress }) => {
  const { isFocused, setIsFocused } = useScrollableSearch();

  return (
    <motion.div
      animate={{ opacity: isFocused ? 1 : 0 }}
      className={`absolute inset-0 z-50 ${isFocused ? 'pointer-events-auto' : 'pointer-events-none'}`}
      onClick={() => {
        if (isFocused) setIsFocused(false);
        onPress?.();
      }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm">
        {children}
      </div>
    </motion.div>
  );
});

const FocusedScreen: React.FC<any> = memo(({ children }) => {
  const { isFocused } = useScrollableSearch();

  return (
    <motion.div
      animate={{ opacity: isFocused ? 1 : 0 }}
      className={`absolute inset-0 ${isFocused ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      {children}
    </motion.div>
  );
});

const ScrollableSearch = Object.assign(
  memo(ScrollableSearchRoot),
  {
    ScrollContent,
    AnimatedComponent,
    Overlay,
    FocusedScreen,
  },
);

export { useScrollableSearch, ScrollableSearch };
