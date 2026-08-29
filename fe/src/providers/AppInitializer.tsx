import { useAppDispatch } from "@/hooks/useRedux";
import { fetchProfile } from "@/store/slices";
import { useEffect, useRef } from "react";

export const AppInitializer = () => {
  const dispatch = useAppDispatch();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only initialize once when component mounts
    if (!hasInitialized.current) {
      hasInitialized.current = true;

      // Only fetch profile if user was previously logged in
      const hasLoginFlag = localStorage.getItem("userLoggedIn") === "true";
      if (hasLoginFlag) {
        dispatch(fetchProfile());
      }
    }
  }, [dispatch]); // Only depend on dispatch

  return null;
};
