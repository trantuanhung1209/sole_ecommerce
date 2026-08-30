import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAppSelector } from "@/hooks/useRedux";
import { wishlistApi } from "@/services/ecommerceServices";
import { wishlistQueryKeys } from "@/lib/queryClient";
import type { WishlistItem } from "@/types/ecommerce.type";
import { getErrorMessage } from "@/utils/getErrorMessage";

export function useWishlist() {
  const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: wishlistQueryKeys.all,
    queryFn: () => wishlistApi.list(),
    enabled: Boolean(isLoggedIn),
  });

  const productIds = useMemo(() => new Set(items.map((item) => item.productId)), [items]);

  const mutation = useMutation({
    mutationFn: async ({ productId, add }: { productId: string; add: boolean }) => {
      if (add) {
        await wishlistApi.add(productId);
        return;
      }
      await wishlistApi.remove(productId);
    },
    onMutate: async ({ productId, add }) => {
      await queryClient.cancelQueries({ queryKey: wishlistQueryKeys.all });
      const previous = queryClient.getQueryData<WishlistItem[]>(wishlistQueryKeys.all) ?? [];

      queryClient.setQueryData<WishlistItem[]>(wishlistQueryKeys.all, (current = []) => {
        if (add) {
          if (current.some((item) => item.productId === productId)) return current;
          return [
            {
              wishlistItemId: `optimistic-${productId}`,
              productId,
              addedAt: new Date().toISOString(),
            },
            ...current,
          ];
        }
        return current.filter((item) => item.productId !== productId);
      });

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(wishlistQueryKeys.all, context.previous);
      }
      toast.error(getErrorMessage(error));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: wishlistQueryKeys.all });
    },
  });

  const isWishlisted = useCallback((productId: string) => productIds.has(productId), [productIds]);

  const toggle = useCallback(
    async (productId: string) => {
      if (!isLoggedIn) {
        toast.info("Vui lòng đăng nhập để lưu yêu thích");
        navigate("/login");
        return;
      }

      const add = !productIds.has(productId);
      try {
        await mutation.mutateAsync({ productId, add });
        toast.success(add ? "Đã thêm vào yêu thích" : "Đã xóa khỏi yêu thích");
      } catch {
        // Error toast handled in onError
      }
    },
    [isLoggedIn, mutation, navigate, productIds]
  );

  return {
    items,
    isWishlisted,
    toggle,
    togglingProductId: mutation.isPending ? mutation.variables?.productId ?? null : null,
  };
}
